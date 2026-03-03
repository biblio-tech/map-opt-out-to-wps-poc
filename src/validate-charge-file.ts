import { setupLogger, getAppLogger } from "./lib/logger";
import { validateCSVFile } from "./lib/csv-parser";

const REQUIRED_HEADERS = ["Term", "CRN", "Course Code", "BibliU Pricing", "Req. ISBN", "Title"];

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: bun run wps:validate-charge-file <csv-file-path>");
    console.error("Example: bun run wps:validate-charge-file data/course-charge.csv");
    process.exit(1);
  }

  logger.info`Validating ${csvPath}...`;
  const validation = await validateCSVFile(csvPath, REQUIRED_HEADERS);

  console.log(`\nFile: ${csvPath}`);
  console.log(`Headers found: ${validation.headers.join(", ")}`);
  console.log(`Total data rows: ${validation.totalRows}`);

  if (validation.missingHeaders.length > 0) {
    console.log(`\nMissing required headers: ${validation.missingHeaders.join(", ")}`);
  }

  if (validation.rowErrors.length > 0) {
    console.log(`\nMalformed rows (${validation.rowErrors.length}):`);
    for (const err of validation.rowErrors) {
      console.log(`  Row ${err.row}: ${err.message}`);
    }
  }

  if (validation.valid) {
    console.log("\nResult: VALID");
  } else {
    console.log("\nResult: INVALID");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
