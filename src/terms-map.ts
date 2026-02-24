import { loadConfig } from "./config";
import { setupLogger, getAppLogger } from "./lib/logger";
import { getToken } from "./lib/auth";
import { getTermList } from "./lib/api";

interface Term {
  code: string;
  name: string;
}

interface TermWrapper {
  terms: Term[];
}

interface TermCodeMapping {
  description: string;
  mappings: Record<string, string>;
}

async function main() {
  await setupLogger();
  const logger = getAppLogger();

  logger.info`Fetching term list and updating mapping...`;

  const config = loadConfig();
  await getToken(config);

  const response = await getTermList(config);

  if (response.error) {
    logger.error`Term list fetch failed: ${response.status} - ${response.error}`;
    console.error("Error:", response.error);
    process.exit(1);
  }

  const termWrapper = response.data as TermWrapper;

  if (!termWrapper?.terms || !Array.isArray(termWrapper.terms)) {
    logger.error`Invalid response format: expected terms array`;
    console.error("Error: Invalid response format");
    process.exit(1);
  }

  // Build mappings from name -> code
  const mappings: Record<string, string> = {};
  for (const term of termWrapper.terms) {
    if (term.name && term.code) {
      mappings[term.name] = term.code;
    }
  }

  const mapping: TermCodeMapping = {
    description: "Maps CSV term names to Watchman API term codes",
    mappings,
  };

  const outputPath = "term-code-mapping.json";
  await Bun.write(outputPath, JSON.stringify(mapping, null, 2) + "\n");

  logger.info`Wrote ${Object.keys(mappings).length} term mappings to ${outputPath}`;
  console.log(`Wrote ${Object.keys(mappings).length} term mappings to ${outputPath}`);
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
