import { resolve } from "path";
import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSVRecords, validateCSVFile } from "./lib/csv-parser";
import {
  mapCourseChargeToAdoption,
  type CourseChargeTermMapping,
} from "./lib/course-charge-mapper";
import { adoptionKey } from "./lib/adoption";
import { getToken } from "./lib/auth";
import { postAdoption } from "./lib/api";
import type { Adoption } from "./types";
import type { TermCodeMapping } from "./lib/term-mapping";

const REQUIRED_HEADERS = ["Term", "CRN", "Course Code", "BibliU Pricing", "Req. ISBN", "Title"];
const DEFAULT_CSV_PATH = "data/course-charge.csv";
const COURSE_CHARGE_TERM_MAPPING_PATH = "data/course-charge-term-mapping.json";
const TERM_CODE_MAPPING_PATH = "data/term-code-mapping.json";

async function loadJsonFile<T>(relativePath: string): Promise<T> {
  const fullPath = resolve(process.cwd(), relativePath);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return file.json() as Promise<T>;
}

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const csvPath = process.argv[2] ?? DEFAULT_CSV_PATH;

  logger.info`Starting bulk adoption upload from ${csvPath}`;

  logger.info`Validating CSV...`;
  const validation = await validateCSVFile(csvPath, REQUIRED_HEADERS);

  if (!validation.valid) {
    if (validation.missingHeaders.length > 0) {
      logger.error`Missing required headers: ${validation.missingHeaders.join(", ")}`;
    }
    for (const err of validation.rowErrors) {
      logger.error`Row ${err.row}: ${err.message}`;
    }
    console.error(`Validation failed: ${validation.missingHeaders.length} missing header(s), ${validation.rowErrors.length} malformed row(s)`);
    process.exit(1);
  }

  logger.info`CSV valid: ${validation.totalRows} rows, ${validation.headers.length} columns`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  const courseChargeTermMapping = await loadJsonFile<CourseChargeTermMapping>(
    COURSE_CHARGE_TERM_MAPPING_PATH
  );
  const termCodeMapping = await loadJsonFile<TermCodeMapping>(
    TERM_CODE_MAPPING_PATH
  );

  await getToken(config);

  const records = await parseCSVRecords(csvPath);
  logger.info`Parsed ${records.length} records from CSV`;

  const seen = new Set<string>();
  const adoptions: Adoption[] = [];
  const skippedRecords: { reason: string; record: Record<string, string> }[] = [];

  for (const record of records) {
    const result = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );

    if (result.skipReason) {
      skippedRecords.push({ reason: result.skipReason, record });
      continue;
    }

    const adoption = result.adoption;
    const key = adoptionKey(
      adoption.termCode!,
      adoption.deptCode,
      adoption.courseCode,
      adoption.section,
      adoption.itemScanCode
    );

    if (!seen.has(key)) {
      seen.add(key);
      adoptions.push(adoption);
    }
  }

  logger.info`Extracted ${adoptions.length} unique adoptions from ${records.length} records (skipped: ${skippedRecords.length})`;

  if (adoptions.length === 0) {
    logger.info`No adoptions to upload`;
    return;
  }

  let totalSuccess = 0;
  let totalErrors = 0;
  const successfulAdoptions: Adoption[] = [];
  const erroredAdoptions: { adoption: Adoption; error: string }[] = [];

  for (let i = 0; i < adoptions.length; i++) {
    const adoption = adoptions[i];
    const term = adoption.termCode!;
    const progress = `(${i + 1} of ${adoptions.length})`;

    try {
      const response = await postAdoption(config, term, adoption);

      if (response.status === 200) {
        totalSuccess++;
        successfulAdoptions.push(adoption);
        logger.info`${progress} Created adoption: ${JSON.stringify(response.data)}`;
      } else {
        totalErrors++;
        erroredAdoptions.push({ adoption, error: `${response.status}: ${response.error}` });
        logger.error`${progress} Failed ${response.status}: ${response.error}`;
      }
    } catch (error) {
      totalErrors++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      erroredAdoptions.push({ adoption, error: errorMessage });
      logger.error`${progress} Exception: ${errorMessage}`;
    }
  }

  logger.info`Adoption upload complete. Success: ${totalSuccess}, Errors: ${totalErrors}, Total: ${adoptions.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total CSV records: ${records.length}`);
  console.log(`Skipped: ${skippedRecords.length}`);
  console.log(`Unique adoptions: ${adoptions.length}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Errors: ${totalErrors}`);

  if (successfulAdoptions.length > 0) {
    console.log(`\n=== Successful Adoptions (${successfulAdoptions.length}) ===`);
    console.log("term,dept,course,section,ISBN,title,costToStudent");
    for (const a of successfulAdoptions) {
      const title = a.itemName.includes(",") || a.itemName.includes('"')
        ? `"${a.itemName.replace(/"/g, '""')}"`
        : a.itemName;
      console.log(`${a.termCode},${a.deptCode},${a.courseCode},${a.section},${a.itemScanCode},${title},${a.costToStudent}`);
    }
  }

  if (erroredAdoptions.length > 0) {
    console.log(`\n=== Errored Adoptions (${erroredAdoptions.length}) ===`);
    console.log("term,dept,course,section,ISBN,title,costToStudent,error");
    for (const { adoption: a, error } of erroredAdoptions) {
      const title = a.itemName.includes(",") || a.itemName.includes('"')
        ? `"${a.itemName.replace(/"/g, '""')}"`
        : a.itemName;
      const escapedError = error.includes(",") || error.includes('"')
        ? `"${error.replace(/"/g, '""')}"`
        : error;
      console.log(`${a.termCode},${a.deptCode},${a.courseCode},${a.section},${a.itemScanCode},${title},${a.costToStudent},${escapedError}`);
    }
  }

  if (skippedRecords.length > 0) {
    const headers = Object.keys(skippedRecords[0].record);
    console.log(`\n=== Skipped Records (${skippedRecords.length}) ===`);
    console.log(["Reason", ...headers].join(","));
    for (const { reason, record } of skippedRecords) {
      const escapedReason = reason.includes(",") || reason.includes('"')
        ? `"${reason.replace(/"/g, '""')}"`
        : reason;
      const values = headers.map((h) => {
        const val = record[h] ?? "";
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      });
      console.log([escapedReason, ...values].join(","));
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
