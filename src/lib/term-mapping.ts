import { resolve } from "path";

export interface TermCodeMapping {
  description?: string;
  mappings: Record<string, string>;
}

let cachedMapping: TermCodeMapping | null = null;

export async function loadTermCodeMappingAsync(
  filePath?: string
): Promise<TermCodeMapping> {
  if (cachedMapping) {
    return cachedMapping;
  }

  const mappingPath = filePath ?? resolve(process.cwd(), "data/term-code-mapping.json");

  const file = Bun.file(mappingPath);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(
      `Term code mapping file not found: ${mappingPath}\n` +
      `Run 'bun run wps:terms:map' to generate it from the API.`
    );
  }

  const content = await file.json();

  if (!content.mappings || typeof content.mappings !== "object") {
    throw new Error(
      `Invalid term code mapping file: missing or invalid 'mappings' object`
    );
  }

  cachedMapping = content as TermCodeMapping;
  return cachedMapping;
}

export function mapTermCode(
  csvTerm: string,
  mapping: TermCodeMapping
): string | null {
  const apiTermCode = mapping.mappings[csvTerm];
  return apiTermCode ?? null;
}

export function clearTermMappingCache(): void {
  cachedMapping = null;
}
