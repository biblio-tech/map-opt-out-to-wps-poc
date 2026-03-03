import { describe, expect, test } from "bun:test";
import { parseCostToStudent, mapCourseChargeToAdoption } from "./course-charge-mapper";
import type { TermCodeMapping } from "./term-mapping";
import type { CourseChargeTermMapping } from "./course-charge-mapper";
import { setupLogger } from "./logger";

const courseChargeTermMapping: CourseChargeTermMapping = {
  "Spring Semester 2026": "Spring 2026",
  "Spring A 2026": "Spring 2026A",
};

const termCodeMapping: TermCodeMapping = {
  mappings: {
    "Spring 2026": "2026SP",
    "Spring 2026A": "2026SA",
  },
};

describe("parseCostToStudent", () => {
  test("parses dollar-prefixed price", () => {
    expect(parseCostToStudent("$125.98")).toBe(125.98);
  });

  test("parses price without dollar sign", () => {
    expect(parseCostToStudent("125.98")).toBe(125.98);
  });

  test("parses $0", () => {
    expect(parseCostToStudent("$0")).toBe(0);
  });

  test("parses zero string", () => {
    expect(parseCostToStudent("0")).toBe(0);
  });

  test("returns 0 for empty string", () => {
    expect(parseCostToStudent("")).toBe(0);
  });

  test("returns 0 for non-numeric string", () => {
    expect(parseCostToStudent("N/A")).toBe(0);
  });
});

describe("mapCourseChargeToAdoption", () => {
  // logger must be initialized before tests run
  test("setup", async () => {
    await setupLogger();
  });

  const baseRecord: Record<string, string> = {
    Term: "Spring Semester 2026",
    CRN: "235907",
    "Course Code": "ACC-201-01",
    "Req. ISBN": "9781265321147",
    Title: "Financial Accounting",
    "BibliU Pricing": "$125.98",
  };

  test("maps fields correctly", () => {
    const result = mapCourseChargeToAdoption(
      baseRecord,
      courseChargeTermMapping,
      termCodeMapping
    );

    expect(result.adoption).toBeDefined();
    expect(result.skipReason).toBeUndefined();
    const adoption = result.adoption!;
    expect(adoption.termCode).toBe("2026SP");
    expect(adoption.crn).toBe("235907");
    expect(adoption.deptCode).toBe("ACC");
    expect(adoption.courseCode).toBe("201");
    expect(adoption.section).toBe("01");
    expect(adoption.itemScanCode).toBe("9781265321147");
    expect(adoption.itemName).toBe("Financial Accounting");
    expect(adoption.costToStudent).toBe(125.98);
  });

  test("returns skipReason for #N/A term", () => {
    const record = { ...baseRecord, Term: "#N/A" };
    const result = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );
    expect(result.adoption).toBeUndefined();
    expect(result.skipReason).toBe("term is #N/A (no term assigned)");
  });

  test("returns skipReason for empty term", () => {
    const record = { ...baseRecord, Term: "" };
    const result = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );
    expect(result.adoption).toBeUndefined();
    expect(result.skipReason).toBe("empty term");
  });

  test("returns skipReason for unmapped course-charge term", () => {
    const record = { ...baseRecord, Term: " Summer 2026 " };
    const result = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );
    expect(result.adoption).toBeUndefined();
    expect(result.skipReason).toBe('unmapped course-charge term: " Summer 2026 "');
  });

  test("returns skipReason for unmapped canonical term", () => {
    const mapping: CourseChargeTermMapping = {
      "Fall Semester 2026": " Fall 2026 ",
    };
    const record = { ...baseRecord, Term: "Fall Semester 2026" };
    const result = mapCourseChargeToAdoption(
      record,
      mapping,
      termCodeMapping
    );
    expect(result.adoption).toBeUndefined();
    expect(result.skipReason).toBe('unmapped term code: " Fall 2026 "');
  });

  test("maps Spring A term variant", () => {
    const record = { ...baseRecord, Term: "Spring A 2026" };
    const result = mapCourseChargeToAdoption(
      record,
      courseChargeTermMapping,
      termCodeMapping
    );

    expect(result.adoption).toBeDefined();
    expect(result.adoption!.termCode).toBe("2026SA");
  });
});
