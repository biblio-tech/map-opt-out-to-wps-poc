import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSV } from "./lib/csv-parser";
import { mapCSVToDTO, UnmappedTermCodeError } from "./lib/mapper";
import { loadTermCodeMappingAsync } from "./lib/term-mapping";
import { getToken } from "./lib/auth";
import { postOptOut } from "./lib/api";
import { AdoptionCache, ensureAdoption } from "./lib/adoption";
import { EnrollmentCache, checkEnrollment } from "./lib/enrollment";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: bun run src/upload.ts <csv-file-path>");
    process.exit(1);
  }

  logger.info`Starting opt-out upload from ${csvPath}`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  const termMapping = await loadTermCodeMappingAsync();
  logger.info`Loaded term code mapping with ${Object.keys(termMapping.mappings).length} entries`;

  await getToken(config);

  const rows = await parseCSV(csvPath);
  logger.info`Parsed ${rows.length} records from CSV`;

  const adoptionCache = new AdoptionCache();
  const enrollmentCache = new EnrollmentCache();

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let adoptionFailCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;

    let dto;
    try {
      dto = mapCSVToDTO(row, termMapping);
    } catch (error) {
      if (error instanceof UnmappedTermCodeError) {
        logger.error`Record ${i + 1} skipped: ${error.message}`;
        skippedCount++;
        continue;
      }
      throw error;
    }

    const termCode = dto.termCode!;

    const adopted = await ensureAdoption(config, dto, adoptionCache);
    if (!adopted) {
      logger.error`Record ${i + 1} skipped: could not ensure adoption for ${dto.departmentCode}-${dto.courseCode}-${dto.sectionCode} ISBN ${dto.itemScanCode}`;
      adoptionFailCount++;
      continue;
    }

    await checkEnrollment(config, termCode, dto.studentId!, {
      deptCode: dto.departmentCode!,
      courseCode: dto.courseCode!,
      section: dto.sectionCode!,
    }, enrollmentCache);

    logger.info`Processing record ${i + 1}/${rows.length}: ${row.studentid} - ${row.ISBN}`;

    try {
      const response = await postOptOut(config, termCode, dto);

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

  logger.info`Upload complete. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}, Adoption failures: ${adoptionFailCount}, Total: ${rows.length}`;

  console.log("\n=== Summary ===");
  console.log(`Total records: ${rows.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log(`Skipped (unmapped term): ${skippedCount}`);
  console.log(`Skipped (adoption failure): ${adoptionFailCount}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
