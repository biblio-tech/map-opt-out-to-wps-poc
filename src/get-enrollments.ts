import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getEnrollments } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const termCode = process.argv[2];
  const studentId = process.argv[3];

  if (!termCode) {
    console.error(
      "Usage: bun run wps:get-enrollments <termCode> [studentId]"
    );
    console.error("Example: bun run wps:get-enrollments 26/01");
    console.error("Example: bun run wps:get-enrollments 26/01 123456");
    process.exit(1);
  }

  const config = loadConfig();
  await getToken(config);

  logger.info`Fetching enrollments for termCode=${termCode}${studentId ? ` studentId=${studentId}` : ""}...`;
  const response = await getEnrollments(config, termCode, studentId);

  if (response.error) {
    logger.error`Enrollment fetch failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Enrollment fetch successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
