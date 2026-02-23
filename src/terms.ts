import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getTermList } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  logger.info`Fetching term list...`;

  const config = loadConfig();
  logger.info`Using API: ${config.apiBaseUrl}`;

  await getToken(config);

  const response = await getTermList(config);

  if (response.error) {
    logger.error`Term list fetch failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Term list fetch successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
