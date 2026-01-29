import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSV } from "./lib/csv-parser";
import { mapCSVToDTO } from "./lib/mapper";
import { getToken } from "./lib/auth";
import { postOptOut } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: bun run src/index.ts <csv-file-path>");
    process.exit(1);
  }

  logger.info`Starting opt-out upload from ${csvPath}`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  await getToken(config);

  const rows = await parseCSV(csvPath);
  logger.info`Parsed ${rows.length} records from CSV`;

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dto = mapCSVToDTO(row);

    logger.info`Processing record ${i + 1}/${rows.length}: ${row.studentid} - ${row.ISBN}`;

    try {
      const response = await postOptOut(config, row.term, dto);

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

  logger.info`Upload complete. Success: ${successCount}, Errors: ${errorCount}, Total: ${rows.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total records: ${rows.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
