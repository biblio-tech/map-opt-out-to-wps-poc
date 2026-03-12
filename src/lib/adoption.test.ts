import { describe, expect, test } from "bun:test";
import { adoptionKey, AdoptionResolveCache } from "./adoption";
import type { Adoption } from "../types";

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

const makeParams = (overrides: Partial<{ crn: string; dept: string; course: string; section: string; itemScanCode: string }> = {}) => ({
  crn: "12345",
  dept: "SW",
  course: "685",
  section: "MOL2",
  itemScanCode: "9780190916510",
  ...overrides,
});

const makeAdoption = (overrides: Partial<Adoption> = {}): Adoption => ({
  deptCode: "SW",
  courseCode: "685",
  section: "MOL2",
  costToStudent: 50,
  itemScanCode: "9780190916510",
  itemName: "Test Book",
  termCode: "2026SP",
  ...overrides,
});

describe("AdoptionResolveCache", () => {
  test("returns undefined for unknown params", () => {
    const cache = new AdoptionResolveCache();
    expect(cache.get(makeParams())).toBeUndefined();
  });

  test("returns adoption after setting", () => {
    const cache = new AdoptionResolveCache();
    const params = makeParams();
    const adoption = makeAdoption();
    cache.set(params, adoption);
    expect(cache.get(params)).toEqual(adoption);
  });

  test("tracks size", () => {
    const cache = new AdoptionResolveCache();
    expect(cache.size).toBe(0);

    cache.set(makeParams(), makeAdoption());
    cache.set(makeParams({ crn: "99999" }), makeAdoption());
    expect(cache.size).toBe(2);
  });

  test("different ISBNs for same CRN resolve independently", () => {
    const cache = new AdoptionResolveCache();
    const params1 = makeParams({ itemScanCode: "ISBN1" });
    const params2 = makeParams({ itemScanCode: "ISBN2" });
    const adoption1 = makeAdoption({ itemScanCode: "ISBN1" });
    const adoption2 = makeAdoption({ itemScanCode: "ISBN2" });

    cache.set(params1, adoption1);
    cache.set(params2, adoption2);

    expect(cache.get(params1)).toEqual(adoption1);
    expect(cache.get(params2)).toEqual(adoption2);
    expect(cache.size).toBe(2);
  });

  test("tracks unresolved adoptions", () => {
    const cache = new AdoptionResolveCache();
    const params = makeParams();
    expect(cache.isUnresolved(params)).toBe(false);

    cache.addUnresolved(params);
    expect(cache.isUnresolved(params)).toBe(true);
  });

  test("returns unresolved adoption keys", () => {
    const cache = new AdoptionResolveCache();
    cache.addUnresolved(makeParams());
    cache.addUnresolved(makeParams({ crn: "99999" }));
    expect(cache.unresolvedAdoptions).toEqual([
      "12345|SW|685|MOL2|9780190916510",
      "99999|SW|685|MOL2|9780190916510",
    ]);
  });

  test("does not double-count duplicate unresolved", () => {
    const cache = new AdoptionResolveCache();
    cache.addUnresolved(makeParams());
    cache.addUnresolved(makeParams());
    expect(cache.unresolvedAdoptions).toEqual(["12345|SW|685|MOL2|9780190916510"]);
  });
});
