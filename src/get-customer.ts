import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getCustomer } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const customerId = process.argv[2];
  const termCode = process.argv[3];

  if (!customerId || !termCode) {
    console.error("Usage: bun run wps:get-customer <customerId> <termCode>");
    console.error("Example: bun run wps:get-customer 3574766 26/01");
    process.exit(1);
  }

  const config = loadConfig();
  await getToken(config);

  logger.info`Fetching customer ${customerId} for term ${termCode}...`;
  const response = await getCustomer(config, customerId, termCode);

  if (response.error) {
    logger.error`Customer fetch failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Customer fetch successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
