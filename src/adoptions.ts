import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getAdoptions } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const term = process.argv[2];

  if (!term) {
    console.error("Usage: bun wps:adoptions <term>");
    console.error("Example: bun wps:adoptions Spr2025");
    process.exit(1);
  }

  logger.info`Fetching adoptions for term=${term}...`;

  const config = loadConfig();
  await getToken(config);

  const response = await getAdoptions(config, term);

  if (response.error) {
    logger.error`Adoption fetch failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Adoption fetch successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
