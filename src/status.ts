import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getStatus } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  logger.info`Fetching API status...`;

  const config = loadConfig();
  await getToken(config);

  const response = await getStatus(config);

  if (response.error) {
    logger.error`Status check failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Status check successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
