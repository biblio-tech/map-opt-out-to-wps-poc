import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSV } from "./lib/csv-parser";
import { getToken } from "./lib/auth";
import { loadTermCodeMappingAsync, mapTermCode } from "./lib/term-mapping";
import { EnrollmentLookup, isEnrolled } from "./lib/course-enrollment";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const optOutsPath = process.argv[2];
  if (!optOutsPath) {
    console.error("Usage: bun run wps:validate-opt-outs <opt-outs-csv>");
    console.error("Example: bun run wps:validate-opt-outs data/opt-outs.csv");
    process.exit(1);
  }

  const config = loadConfig();
  await getToken(config);

  const termMapping = await loadTermCodeMappingAsync();
  const enrollmentLookup = new EnrollmentLookup();

  logger.info`Loading opt-outs from ${optOutsPath}...`;
  const optOuts = await parseCSV(optOutsPath);
  logger.info`Loaded ${optOuts.length} opt-out records`;

  const unmatched: { row: (typeof optOuts)[number]; termCode: string }[] = [];
  let unmappedTermCount = 0;

  for (const row of optOuts) {
    const termCode = mapTermCode(row.term, termMapping);
    if (!termCode) {
      unmappedTermCount++;
      logger.error`No term mapping for "${row.term}" (student ${row.studentid}, CRN ${row.crn})`;
      continue;
    }
    if (!(await isEnrolled(enrollmentLookup, config, termCode, row.studentid, row.crn))) {
      unmatched.push({ row, termCode });
    }
  }

  console.log(`\nOpt-outs file: ${optOutsPath}`);
  console.log(`Total opt-outs: ${optOuts.length}`);
  console.log(`Matched in enrollment: ${optOuts.length - unmatched.length - unmappedTermCount}`);
  console.log(`Not in enrollment: ${unmatched.length}`);
  console.log(`Unmapped term: ${unmappedTermCount}`);

  if (unmatched.length > 0) {
    console.log(`\nUnmatched opt-outs:`);
    console.log(
      `${"Student ID".padEnd(12)} ${"Term".padEnd(8)} ${"CRN".padEnd(10)} Course & Section`
    );
    console.log("-".repeat(55));
    for (const { row, termCode } of unmatched) {
      console.log(
        `${row.studentid.padEnd(12)} ${termCode.padEnd(8)} ${row.crn.padEnd(10)} ${row.courseandsectioncode}`
      );
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
