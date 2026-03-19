import { setupLogger, getAppLogger } from "./lib/logger";
import { parseCSV } from "./lib/csv-parser";
import { loadCourseEnrollment, isEnrolled, suggestCRN } from "./lib/course-enrollment";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const optOutsPath = process.argv[2];
  if (!optOutsPath) {
    console.error("Usage: bun run wps:validate-opt-outs <opt-outs-csv>");
    console.error("Example: bun run wps:validate-opt-outs data/opt-outs.csv");
    process.exit(1);
  }

  logger.info`Loading enrollment data...`;
  const enrollment = await loadCourseEnrollment();
  logger.info`Loaded ${enrollment.totalRecords} enrollment records (${enrollment.byStudentAndCRN.size} unique student/CRN pairs)`;

  logger.info`Loading opt-outs from ${optOutsPath}...`;
  const optOuts = await parseCSV(optOutsPath);
  logger.info`Loaded ${optOuts.length} opt-out records`;

  const unmatched: typeof optOuts = [];

  for (const row of optOuts) {
    if (!isEnrolled(enrollment, row.studentid, row.crn)) {
      unmatched.push(row);
    }
  }

  console.log(`\nOpt-outs file: ${optOutsPath}`);
  console.log(`Total opt-outs: ${optOuts.length}`);
  console.log(`Matched in enrollment: ${optOuts.length - unmatched.length}`);
  console.log(`Not in enrollment: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log(`\nUnmatched opt-outs:`);
    console.log(
      `${"Student ID".padEnd(12)} ${"CRN".padEnd(10)} ${"Course & Section".padEnd(18)} Suggested CRN`
    );
    console.log("-".repeat(65));
    for (const row of unmatched) {
      const altCrn = suggestCRN(enrollment, row.studentid, row.courseandsectioncode);
      const suggestion = altCrn ? altCrn : "-";
      console.log(
        `${row.studentid.padEnd(12)} ${row.crn.padEnd(10)} ${row.courseandsectioncode.padEnd(18)} ${suggestion}`
      );
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
