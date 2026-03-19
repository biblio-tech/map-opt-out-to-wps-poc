import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import type { CSVRow } from "./types";
import { parseCSV } from "./lib/csv-parser";
import { mapCSVToDTO, parseCourseAndSectionCode } from "./lib/mapper";
import { loadTermCodeMappingAsync, mapTermCode } from "./lib/term-mapping";
import { getToken } from "./lib/auth";
import { postOptOut } from "./lib/api";
import { AdoptionResolveCache, resolveAdoption } from "./lib/adoption";
import { loadCourseEnrollment, isEnrolled, suggestCRN, getStudentDetails } from "./lib/course-enrollment";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error("Usage: bun run wps:add-opt-outs <csv-file-path> [--dry-run]");
    process.exit(1);
  }

  if (dryRun) {
    logger.info`DRY RUN mode — no opt-outs will be posted`;
  }
  logger.info`Starting opt-out upload from ${csvPath}`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  const termMapping = await loadTermCodeMappingAsync();
  const candidateTerms = [...new Set(Object.values(termMapping.mappings))];
  logger.info`Candidate terms for CRN resolution: ${candidateTerms.join(", ")}`;

  await getToken(config);

  const rows = await parseCSV(csvPath);
  logger.info`Parsed ${rows.length} records from CSV`;

  logger.info`Loading course enrollment data...`;
  const enrollment = await loadCourseEnrollment();
  logger.info`Loaded ${enrollment.totalRecords} enrollment records`;

  const adoptionCache = new AdoptionResolveCache();

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let termMismatchCount = 0;
  let enrollmentMismatchCount = 0;

  const unresolvedAdoptionRows: CSVRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    logger.info`Processing record ${i + 1}/${rows.length}: ${csvRowToLine(row)}`;

    const { departmentCode, courseCode, sectionCode } = parseCourseAndSectionCode(row.courseandsectioncode);

    const adoption = await resolveAdoption(
      config,
      {
        crn: row.crn,
        dept: departmentCode,
        course: courseCode,
        section: sectionCode,
        itemScanCode: row.ISBN,
      },
      candidateTerms,
      adoptionCache
    );

    if (!adoption) {
      logger.error`Record ${i + 1} skipped: no matching adoption for CRN ${row.crn} ISBN ${row.ISBN} (${row.courseandsectioncode})`;
      skippedCount++;
      unresolvedAdoptionRows.push(row);
      continue;
    }

    const resolvedTermCode = adoption.termCode!;

    // Warn if the resolved term differs from what the CSV term would have mapped to
    const csvMappedTerm = mapTermCode(row.term, termMapping);
    if (csvMappedTerm && csvMappedTerm !== resolvedTermCode) {
      logger.warn`Record ${i + 1}: CSV term "${row.term}" maps to ${csvMappedTerm}, but CRN ${row.crn} resolved to ${resolvedTermCode}`;
      termMismatchCount++;
    }

    const dto = mapCSVToDTO(row, resolvedTermCode);

    // csv doesn't contain PII so need this from the enrollment file
    const student = getStudentDetails(enrollment, row.studentid);
    if (student) {
      dto.firsName = student.firstName;
      dto.lastName = student.lastName;
      dto.email = student.email;
    }

    if (!isEnrolled(enrollment, row.studentid, row.crn)) {
      enrollmentMismatchCount++;
      const altCrn = suggestCRN(enrollment, row.studentid, row.courseandsectioncode);
      if (altCrn) {
        logger.error`Record ${i + 1}: student ${row.studentid} not enrolled for CRN ${row.crn} (${row.courseandsectioncode}), suggested CRN: ${altCrn}`;
      } else {
        logger.error`Record ${i + 1}: student ${row.studentid} not enrolled for CRN ${row.crn} (${row.courseandsectioncode}), no matching enrollment found`;
      }
    }

    if (dryRun) {
      const url = `${config.apiBaseUrl}/cart/v1/admin/opt_out/${encodeURIComponent(resolvedTermCode)}`;
      logger.debug`[DRY RUN] POST ${url} ${JSON.stringify(dto)}`;
      successCount++;
      continue;
    }

    try {
      const response = await postOptOut(config, resolvedTermCode, dto);

      if (response.status === 200) {
        logger.info`Record ${i + 1} processed successfully`;
        successCount++;
      } else {
        logger.error`Record ${i + 1} failed: ${response.status} - ${response.error}`;
        errorCount++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error`Record ${i + 1} exception: ${errorMessage}`;
      errorCount++;
    }
  }

  logger.info`Upload complete. Success: ${successCount}, Errors: ${errorCount}, Skipped (unresolved adoption): ${skippedCount}, Term mismatches: ${termMismatchCount}, Enrollment mismatches: ${enrollmentMismatchCount}, Total: ${rows.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total records: ${rows.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Skipped (unresolved adoption): ${skippedCount}`);
  console.log(`Term mismatches (CSV vs resolved): ${termMismatchCount}`);
  console.log(`Enrollment mismatches: ${enrollmentMismatchCount}`);

  const unresolvedAdoptions = adoptionCache.unresolvedAdoptions;
  if (unresolvedAdoptions.length > 0) {
    console.log(`\n=== Unresolved Adoptions (${unresolvedAdoptions.length}) ===`);
    console.log("crn|dept|course|section|ISBN");
    for (const key of unresolvedAdoptions) {
      console.log(key.replace(/\|/g, " | "));
    }
  }

  if (unresolvedAdoptionRows.length > 0) {
    console.log(`\n=== Rows with Unresolved Adoptions (${unresolvedAdoptionRows.length}) ===`);
    console.log(CSV_HEADER);
    for (const row of unresolvedAdoptionRows) {
      console.log(csvRowToLine(row));
    }
  }
}

const CSV_HEADER = "Date Sent,term,crn,courseandsectioncode,studentid,ISBN,title,author,publisher,startdate,censusdate,enddate,coursetitle,coursecode,enrollmentstatus,optout,contenttype";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRowToLine(row: CSVRow): string {
  return [
    row.dateSent, row.term, row.crn, row.courseandsectioncode, row.studentid,
    row.ISBN, row.title, row.author,
    row.publisher, row.startdate, row.censusdate, row.enddate, row.coursetitle,
    row.coursecode, row.enrollmentstatus, row.optout, row.contenttype,
  ].map(csvEscape).join(",");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
