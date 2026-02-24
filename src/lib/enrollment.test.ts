import { describe, expect, test } from "bun:test";
import { enrollmentKey, EnrollmentCache } from "./enrollment";

describe("enrollmentKey", () => {
  test("builds composite key from all fields", () => {
    expect(enrollmentKey("2026SP", "SW", "685", "MOL2", "3575856")).toBe(
      "2026SP|SW|685|MOL2|3575856"
    );
  });

  test("handles empty fields", () => {
    expect(enrollmentKey("2026SP", "SW", "685", "", "3575856")).toBe(
      "2026SP|SW|685||3575856"
    );
  });

  test("different students produce different keys", () => {
    const key1 = enrollmentKey("2026SP", "SW", "685", "MOL2", "111");
    const key2 = enrollmentKey("2026SP", "SW", "685", "MOL2", "222");
    expect(key1).not.toBe(key2);
  });
});

describe("EnrollmentCache", () => {
  test("reports false for unknown key", () => {
    const cache = new EnrollmentCache();
    expect(cache.has("unknown")).toBe(false);
  });

  test("reports true after adding key", () => {
    const cache = new EnrollmentCache();
    cache.add("2026SP|SW|685|MOL2|3575856");
    expect(cache.has("2026SP|SW|685|MOL2|3575856")).toBe(true);
  });

  test("tracks size", () => {
    const cache = new EnrollmentCache();
    expect(cache.size).toBe(0);

    cache.add("key1");
    cache.add("key2");
    expect(cache.size).toBe(2);
  });

  test("does not double-count duplicate keys", () => {
    const cache = new EnrollmentCache();
    cache.add("key1");
    cache.add("key1");
    expect(cache.size).toBe(1);
  });
});
