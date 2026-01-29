import { describe, expect, test, beforeEach } from "bun:test";
import { resolve } from "path";
import {
  loadTermCodeMappingAsync,
  mapTermCode,
  clearTermMappingCache,
  type TermCodeMapping,
} from "./term-mapping";

describe("mapTermCode", () => {
  const mapping: TermCodeMapping = {
    mappings: {
      "Spring 2026": "2026SP",
      "Summer 2026": "2026SU",
      "Fall 2026": "2026FA",
    },
  };

  test("returns mapped term code for known term", () => {
    expect(mapTermCode("Spring 2026", mapping)).toBe("2026SP");
  });

  test("returns mapped term code for another known term", () => {
    expect(mapTermCode("Fall 2026", mapping)).toBe("2026FA");
  });

  test("returns null for unknown term", () => {
    expect(mapTermCode("Winter 2026", mapping)).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(mapTermCode("", mapping)).toBeNull();
  });

  test("is case-sensitive", () => {
    expect(mapTermCode("spring 2026", mapping)).toBeNull();
  });
});

describe("loadTermCodeMappingAsync", () => {
  beforeEach(() => {
    clearTermMappingCache();
  });

  test("loads valid mapping file", async () => {
    const mapping = await loadTermCodeMappingAsync(
      resolve(import.meta.dir, "../../term-code-mapping.json")
    );
    expect(mapping.mappings).toBeDefined();
    expect(typeof mapping.mappings).toBe("object");
    expect(mapping.mappings["Spring 2026"]).toBe("2026SP");
  });

  test("throws error for non-existent file", async () => {
    await expect(
      loadTermCodeMappingAsync("/nonexistent/path/mapping.json")
    ).rejects.toThrow("Term code mapping file not found");
  });

  test("caches loaded mapping", async () => {
    const path = resolve(import.meta.dir, "../../term-code-mapping.json");
    const mapping1 = await loadTermCodeMappingAsync(path);
    const mapping2 = await loadTermCodeMappingAsync(path);
    expect(mapping1).toBe(mapping2);
  });
});

describe("clearTermMappingCache", () => {
  test("allows reloading mapping after clear", async () => {
    const path = resolve(import.meta.dir, "../../term-code-mapping.json");

    const mapping1 = await loadTermCodeMappingAsync(path);
    clearTermMappingCache();
    const mapping2 = await loadTermCodeMappingAsync(path);

    expect(mapping1).not.toBe(mapping2);
    expect(mapping1).toEqual(mapping2);
  });
});
