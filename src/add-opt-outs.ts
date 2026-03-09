import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSV } from "./lib/csv-parser";
import { mapCSVToDTO, parseCourseAndSectionCode } from "./lib/mapper";
import { loadTermCodeMappingAsync, mapTermCode } from "./lib/term-mapping";
import { getToken } from "./lib/auth";
import { postOptOut } from "./lib/api";
import { AdoptionCache, CRNTermCache, checkAdoptionExists, resolveTermCodeByCRN } from "./lib/adoption";
import { loadCourseEnrollment, isEnrolled, suggestCRN } from "./lib/course-enrollment";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: bun run wps:add-opt-outs <csv-file-path>");
    process.exit(1);
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

  const adoptionCache = new AdoptionCache();
  const crnTermCache = new CRNTermCache();

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let missingAdoptionCount = 0;
  let termMismatchCount = 0;
  let enrollmentMismatchCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    const { departmentCode } = parseCourseAndSectionCode(row.courseandsectioncode);

    const resolvedTermCode = await resolveTermCodeByCRN(
      config,
      row.crn,
      departmentCode,
      candidateTerms,
      crnTermCache
    );

    if (!resolvedTermCode) {
      logger.error`Record ${i + 1} skipped: no adoption found for CRN ${row.crn} in any term`;
      skippedCount++;
      missingAdoptionCount++;
      continue;
    }

    // Warn if the resolved term differs from what the CSV term would have mapped to
    const csvMappedTerm = mapTermCode(row.term, termMapping);
    if (csvMappedTerm && csvMappedTerm !== resolvedTermCode) {
      logger.warn`Record ${i + 1}: CSV term "${row.term}" maps to ${csvMappedTerm}, but CRN ${row.crn} resolved to ${resolvedTermCode}`;
      termMismatchCount++;
    }

    const dto = mapCSVToDTO(row, resolvedTermCode);

    const adoptionExists = await checkAdoptionExists(config, dto, adoptionCache);
    if (!adoptionExists) {
      missingAdoptionCount++;
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

    logger.info`Processing record ${i + 1}/${rows.length}: ${row.studentid} - ${row.ISBN} (term: ${resolvedTermCode})`;

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

  logger.info`Upload complete. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}, Missing adoptions: ${missingAdoptionCount}, Term mismatches: ${termMismatchCount}, Enrollment mismatches: ${enrollmentMismatchCount}, Total: ${rows.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total records: ${rows.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Skipped (unresolved CRN): ${skippedCount}`);
  console.log(`Records with missing adoption: ${missingAdoptionCount}`);
  console.log(`Term mismatches (CSV vs resolved): ${termMismatchCount}`);
  console.log(`Enrollment mismatches: ${enrollmentMismatchCount}`);

  const missingAdoptions = adoptionCache.missingKeys;
  if (missingAdoptions.length > 0) {
    console.log(`\n=== Missing Adoptions (${missingAdoptions.length}) ===`);
    console.log("term|dept|course|section|ISBN");
    for (const key of missingAdoptions) {
      console.log(key.replace(/\|/g, " | "));
    }
  }

  const unresolvedCRNs = crnTermCache.unresolvedCRNs;
  if (unresolvedCRNs.length > 0) {
    console.log(`\n=== Unresolved CRNs (${unresolvedCRNs.length}) ===`);
    for (const crn of unresolvedCRNs) {
      console.log(crn);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
