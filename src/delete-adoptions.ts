import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { deleteAdoption } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const term = process.argv[2];
  const dept = process.argv[3];
  const crn = process.argv[4];

  if (!term || !dept) {
    console.error(
      "Usage: bun run wps:delete-adoptions <term> <dept> [crn]"
    );
    console.error(
      "Example: bun run wps:delete-adoptions 26/01 ACC"
    );
    console.error(
      "Example: bun run wps:delete-adoptions 26/01 ACC 239628"
    );
    process.exit(1);
  }

  const config = loadConfig();
  await getToken(config);

  logger.info`Deleting adoptions for term=${term} dept=${dept}${crn ? ` crn=${crn}` : ""}...`;

  const response = await deleteAdoption(config, term, { dept, crn });

  if (response.error) {
    logger.error`Delete failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  logger.info`Delete successful`;
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
