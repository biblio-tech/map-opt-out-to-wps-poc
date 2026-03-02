import { describe, expect, test } from "bun:test";
import { adoptionKey, AdoptionCache } from "./adoption";

describe("adoptionKey", () => {
  test("builds composite key from all fields", () => {
    expect(adoptionKey("2026SP", "SW", "685", "MOL2", "9780190916510")).toBe(
      "2026SP|SW|685|MOL2|9780190916510"
    );
  });

  test("handles empty fields", () => {
    expect(adoptionKey("2026SP", "SW", "685", "", "9780190916510")).toBe(
      "2026SP|SW|685||9780190916510"
    );
  });
});

describe("AdoptionCache", () => {
  test("reports false for unknown key", () => {
    const cache = new AdoptionCache();
    expect(cache.has("unknown")).toBe(false);
  });

  test("reports true after adding key", () => {
    const cache = new AdoptionCache();
    cache.add("2026SP|SW|685|MOL2|9780190916510");
    expect(cache.has("2026SP|SW|685|MOL2|9780190916510")).toBe(true);
  });

  test("tracks size", () => {
    const cache = new AdoptionCache();
    expect(cache.size).toBe(0);

    cache.add("key1");
    cache.add("key2");
    expect(cache.size).toBe(2);
  });

  test("does not double-count duplicate keys", () => {
    const cache = new AdoptionCache();
    cache.add("key1");
    cache.add("key1");
    expect(cache.size).toBe(1);
  });

  test("tracks missing adoptions", () => {
    const cache = new AdoptionCache();
    expect(cache.isMissing("key1")).toBe(false);

    cache.addMissing("key1");
    expect(cache.isMissing("key1")).toBe(true);
  });

  test("returns missing keys", () => {
    const cache = new AdoptionCache();
    cache.addMissing("key1");
    cache.addMissing("key2");
    expect(cache.missingKeys).toEqual(["key1", "key2"]);
  });

  test("does not double-count duplicate missing keys", () => {
    const cache = new AdoptionCache();
    cache.addMissing("key1");
    cache.addMissing("key1");
    expect(cache.missingKeys).toEqual(["key1"]);
  });
});
