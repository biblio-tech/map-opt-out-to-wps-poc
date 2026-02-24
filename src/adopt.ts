import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSVRecords } from "./lib/csv-parser";
import { mapBooklistToAdoption } from "./lib/booklist-mapper";
import { adoptionKey } from "./lib/adoption";
import { getToken } from "./lib/auth";
import { postAdoptionsBulk } from "./lib/api";
import type { Adoption, UploadResult } from "./types";

const BATCH_SIZE = 500;
const DEFAULT_CSV_PATH = "data/full-booklist.csv";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const termCode = process.argv[2];
  if (!termCode) {
    console.error("Usage: bun run src/adopt.ts <term-code> [csv-path]");
    console.error("Example: bun run src/adopt.ts 2026SP data/full-booklist.csv");
    process.exit(1);
  }

  const csvPath = process.argv[3] ?? DEFAULT_CSV_PATH;

  logger.info`Starting bulk adoption upload from ${csvPath} for term ${termCode}`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  await getToken(config);

  const records = await parseCSVRecords(csvPath);
  logger.info`Parsed ${records.length} records from CSV`;

  const seen = new Set<string>();
  const adoptions: Adoption[] = [];

  for (const record of records) {
    const adoption = mapBooklistToAdoption(record, termCode);
    const key = adoptionKey(
      termCode,
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

  logger.info`Extracted ${adoptions.length} unique adoptions from ${records.length} records`;

  if (adoptions.length === 0) {
    logger.info`No adoptions to upload`;
    return;
  }

  let totalSuccess = 0;
  let totalErrors = 0;
  let batchCount = 0;

  for (let i = 0; i < adoptions.length; i += BATCH_SIZE) {
    const batch = adoptions.slice(i, i + BATCH_SIZE);
    batchCount++;

    logger.info`Uploading batch ${batchCount} (${batch.length} adoptions, ${i + 1}-${Math.min(i + BATCH_SIZE, adoptions.length)} of ${adoptions.length})`;

    try {
      const response = await postAdoptionsBulk(config, batch);

      if (response.status === 200 && response.data) {
        const result = response.data as UploadResult;
        totalSuccess += result.successfulRecords;
        totalErrors += result.errorRecords;

        logger.info`Batch ${batchCount}: ${result.successfulRecords} success, ${result.errorRecords} errors`;

        if (result.warnings?.length > 0) {
          for (const w of result.warnings) {
            logger.info`Batch ${batchCount} warning at entry ${w.entryNumber}: ${w.messages.join(", ")}`;
          }
        }
        if (result.errors?.length > 0) {
          for (const e of result.errors) {
            logger.error`Batch ${batchCount} error at entry ${e.entryNumber}: ${e.messages.join(", ")}`;
          }
        }
      } else {
        logger.error`Batch ${batchCount} failed: ${response.status} - ${response.error}`;
        totalErrors += batch.length;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error`Batch ${batchCount} exception: ${errorMessage}`;
      totalErrors += batch.length;
    }
  }

  logger.info`Bulk adoption complete. Batches: ${batchCount}, Success: ${totalSuccess}, Errors: ${totalErrors}, Total unique: ${adoptions.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total CSV records: ${records.length}`);
  console.log(`Unique adoptions: ${adoptions.length}`);
  console.log(`Batches sent: ${batchCount}`);
  console.log(`Successful: ${totalSuccess}`);
  console.log(`Errors: ${totalErrors}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
