import { describe, expect, test } from "bun:test";
import { adoptionKey, dtoToAdoption, AdoptionCache } from "./adoption";
import type { OptInOptOutDTO } from "../types";

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

describe("dtoToAdoption", () => {
  const dto: OptInOptOutDTO = {
    termCode: "2026SP",
    crn: "241018",
    departmentCode: "SW",
    courseCode: "685",
    sectionCode: "MOL2",
    studentId: "3575856",
    itemScanCode: "9780190916510",
    title: "Program Evaluation",
    publisher: "Oxford University Press",
    optOut: true,
    contentType: "DIGITAL",
  };

  test("maps DTO fields to Adoption model", () => {
    const adoption = dtoToAdoption(dto);

    expect(adoption.termCode).toBe("2026SP");
    expect(adoption.crn).toBe("241018");
    expect(adoption.deptCode).toBe("SW");
    expect(adoption.courseCode).toBe("685");
    expect(adoption.section).toBe("MOL2");
    expect(adoption.itemScanCode).toBe("9780190916510");
    expect(adoption.itemName).toBe("Program Evaluation");
    expect(adoption.publisher).toBe("Oxford University Press");
  });

  test("defaults costToStudent to 0", () => {
    const adoption = dtoToAdoption(dto);
    expect(adoption.costToStudent).toBe(0);
  });

  test("does not include student-specific fields", () => {
    const adoption = dtoToAdoption(dto);
    expect(adoption).not.toHaveProperty("studentId");
    expect(adoption).not.toHaveProperty("optOut");
    expect(adoption).not.toHaveProperty("contentType");
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
});
