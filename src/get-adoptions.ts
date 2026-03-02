import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getAdoptions, getAdoptionFiltered } from "./lib/api";

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  const term = process.argv[2];

  if (!term) {
    console.error("Usage: bun run wps:get-adoptions <term> [dept] [crn]");
    console.error("Example: bun run wps:get-adoptions 2026SP");
    console.error("Example: bun run wps:get-adoptions 2026SP ACC");
    console.error("Example: bun run wps:get-adoptions 2026SP ACC 235907");
    process.exit(1);
  }

  const dept = process.argv[3];
  const crn = process.argv[4];

  const config = loadConfig();
  await getToken(config);

  let response;

  if (dept) {
    logger.info`Fetching adoptions for term=${term} dept=${dept}${crn ? ` crn=${crn}` : ""}...`;
    response = await getAdoptionFiltered(config, term, { dept, crn });
  } else {
    logger.info`Fetching adoptions for term=${term}...`;
    response = await getAdoptions(config, term);
  }

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
