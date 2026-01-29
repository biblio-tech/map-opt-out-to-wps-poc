import { describe, expect, test } from "bun:test";
import { parseCSVLine } from "./csv-parser";

describe("parseCSVLine", () => {
  test("parses simple comma-separated values", () => {
    const result = parseCSVLine("a,b,c");
    expect(result).toEqual(["a", "b", "c"]);
  });

  test("handles quoted fields with commas inside", () => {
    const result = parseCSVLine('a,"b,c",d');
    expect(result).toEqual(["a", "b,c", "d"]);
  });

  test("handles escaped quotes inside quoted fields", () => {
    const result = parseCSVLine('a,"b""c",d');
    expect(result).toEqual(["a", 'b"c', "d"]);
  });

  test("handles empty fields", () => {
    const result = parseCSVLine("a,,c");
    expect(result).toEqual(["a", "", "c"]);
  });

  test("trims whitespace from fields", () => {
    const result = parseCSVLine("  a  ,  b  ,  c  ");
    expect(result).toEqual(["a", "b", "c"]);
  });

  test("handles complex author field with commas", () => {
    const result = parseCSVLine('"Unrau, Y.A., Gabor, P.A. & Grinnell, R.M.",Oxford');
    expect(result).toEqual(["Unrau, Y.A., Gabor, P.A. & Grinnell, R.M.", "Oxford"]);
  });

  test("handles single field", () => {
    const result = parseCSVLine("single");
    expect(result).toEqual(["single"]);
  });

  test("handles empty string", () => {
    const result = parseCSVLine("");
    expect(result).toEqual([""]);
  });
});
