import { resolve } from "path";
import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSVRecords } from "./lib/csv-parser";
import {
  mapCourseChargeToAdoption,
  type CourseChargeTermMapping,
} from "./lib/course-charge-mapper";
import { adoptionKey } from "./lib/adoption";
import { getToken } from "./lib/auth";
import { postAdoption } from "./lib/api";
import type { Adoption } from "./types";
import type { TermCodeMapping } from "./lib/term-mapping";

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
  const skippedNARecords: Record<string, string>[] = [];
  const skippedUnmappedRecords: Record<string, string>[] = [];

  for (const record of records) {
    const term = record["Term"];
    if (term === "#N/A") {
      skippedNARecords.push(record);
      continue;
    }

    const adoption = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );

    if (!adoption) {
      skippedUnmappedRecords.push(record);
      continue;
    }

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

  logger.info`Extracted ${adoptions.length} unique adoptions from ${records.length} records (skipped: ${skippedNARecords.length} #N/A, ${skippedUnmappedRecords.length} unmapped)`;

  if (adoptions.length === 0) {
    logger.info`No adoptions to upload`;
    return;
  }

  let totalSuccess = 0;
  let totalErrors = 0;

  for (let i = 0; i < adoptions.length; i++) {
    const adoption = adoptions[i];
    const term = adoption.termCode!;
    const progress = `(${i + 1} of ${adoptions.length})`;

    try {
      const response = await postAdoption(config, term, adoption);

      if (response.status === 200) {
        totalSuccess++;
        logger.info`${progress} Created adoption: ${JSON.stringify(response.data)}`;
      } else {
        totalErrors++;
        logger.error`${progress} Failed ${response.status}: ${response.error}`;
      }
    } catch (error) {
      totalErrors++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error`${progress} Exception: ${errorMessage}`;
    }
  }

  logger.info`Adoption upload complete. Success: ${totalSuccess}, Errors: ${totalErrors}, Total: ${adoptions.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total CSV records: ${records.length}`);
  console.log(`Skipped #N/A: ${skippedNARecords.length}`);
  console.log(`Skipped unmapped: ${skippedUnmappedRecords.length}`);
  console.log(`Unique adoptions: ${adoptions.length}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Errors: ${totalErrors}`);

  const allSkipped = [
    ...skippedNARecords.map((r) => ({ reason: "#N/A", record: r })),
    ...skippedUnmappedRecords.map((r) => ({ reason: "unmapped term", record: r })),
  ];

  if (allSkipped.length > 0) {
    const headers = Object.keys(allSkipped[0].record);
    console.log("\n=== Skipped Records ===");
    console.log(["Reason", ...headers].join(","));
    for (const { reason, record } of allSkipped) {
      const values = headers.map((h) => {
        const val = record[h] ?? "";
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      });
      console.log([reason, ...values].join(","));
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
