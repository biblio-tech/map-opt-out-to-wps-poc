import { describe, expect, test } from "bun:test";
import {
  mapContentType,
  parseOptOut,
  parseCourseAndSectionCode,
  mapCSVToDTO,
} from "./mapper";
import type { CSVRow } from "../types";

describe("mapContentType", () => {
  test('maps "eBook" to "DIGITAL"', () => {
    expect(mapContentType("eBook")).toBe("DIGITAL");
  });

  test('maps "ebook" (lowercase) to "DIGITAL"', () => {
    expect(mapContentType("ebook")).toBe("DIGITAL");
  });

  test('maps "EBOOK" (uppercase) to "DIGITAL"', () => {
    expect(mapContentType("EBOOK")).toBe("DIGITAL");
  });

  test('maps "Courseware" to "COURSEWARE"', () => {
    expect(mapContentType("Courseware")).toBe("COURSEWARE");
  });

  test('maps "courseware" (lowercase) to "COURSEWARE"', () => {
    expect(mapContentType("courseware")).toBe("COURSEWARE");
  });

  test('maps unknown value to "PHYSICAL"', () => {
    expect(mapContentType("other")).toBe("PHYSICAL");
  });

  test("handles whitespace", () => {
    expect(mapContentType("  eBook  ")).toBe("DIGITAL");
  });
});

describe("parseOptOut", () => {
  test('returns true for "Opted out"', () => {
    expect(parseOptOut("Opted out")).toBe(true);
  });

  test('returns true for "opted out" (lowercase)', () => {
    expect(parseOptOut("opted out")).toBe(true);
  });

  test('returns true for "true"', () => {
    expect(parseOptOut("true")).toBe(true);
  });

  test('returns true for "TRUE"', () => {
    expect(parseOptOut("TRUE")).toBe(true);
  });

  test('returns false for "false"', () => {
    expect(parseOptOut("false")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(parseOptOut("")).toBe(false);
  });

  test("handles whitespace", () => {
    expect(parseOptOut("  Opted out  ")).toBe(true);
  });
});

describe("parseCourseAndSectionCode", () => {
  test("parses standard 3-part code", () => {
    expect(parseCourseAndSectionCode("SW-685-MOL2")).toEqual({
      departmentCode: "SW",
      courseCode: "685",
      sectionCode: "MOL2",
    });
  });

  test("parses another 3-part code", () => {
    expect(parseCourseAndSectionCode("ANE-614-01")).toEqual({
      departmentCode: "ANE",
      courseCode: "614",
      sectionCode: "01",
    });
  });

  test("handles 2-part code", () => {
    expect(parseCourseAndSectionCode("SW-685")).toEqual({
      departmentCode: "SW",
      courseCode: "685",
      sectionCode: "",
    });
  });

  test("handles 1-part code", () => {
    expect(parseCourseAndSectionCode("SW")).toEqual({
      departmentCode: "SW",
      courseCode: "",
      sectionCode: "",
    });
  });

  test("handles 4+ part code (joins extra parts in sectionCode)", () => {
    expect(parseCourseAndSectionCode("SW-685-MOL2-LAB")).toEqual({
      departmentCode: "SW",
      courseCode: "685",
      sectionCode: "MOL2-LAB",
    });
  });
});

describe("mapCSVToDTO", () => {
  const baseRow: CSVRow = {
    dateSent: "12-29",
    term: "Spring 2026",
    crn: "241018",
    courseandsectioncode: "SW-685-MOL2",
    studentid: "3575856",
    firstname: "Silvana",
    lastname: "Armentano",
    email: "silvana@example.com",
    ISBN: "9780190916510",
    title: "Program Evaluation",
    author: "Unrau, Y.A.",
    publisher: "Oxford University Press",
    startdate: "2026-01-17",
    censusdate: "2026-01-18",
    enddate: "2026-04-25",
    coursetitle: "EVAL CLINICAL PRACTICE",
    coursecode: "685",
    enrollmentstatus: "TRUE",
    optout: "Opted out",
    contenttype: "eBook",
  };

  test("maps full row with eBook content type", () => {
    const result = mapCSVToDTO(baseRow);

    expect(result.termCode).toBe("Spring 2026");
    expect(result.crn).toBe("241018");
    expect(result.departmentCode).toBe("SW");
    expect(result.courseCode).toBe("685");
    expect(result.sectionCode).toBe("MOL2");
    expect(result.studentId).toBe("3575856");
    expect(result.firsName).toBe("Silvana");
    expect(result.lastName).toBe("Armentano");
    expect(result.email).toBe("silvana@example.com");
    expect(result.itemScanCode).toBe("9780190916510");
    expect(result.title).toBe("Program Evaluation");
    expect(result.author).toBe("Unrau, Y.A.");
    expect(result.publisher).toBe("Oxford University Press");
    expect(result.optOut).toBe(true);
    expect(result.contentType).toBe("DIGITAL");
  });

  test("maps row with Courseware content type", () => {
    const row: CSVRow = { ...baseRow, contenttype: "Courseware" };
    const result = mapCSVToDTO(row);
    expect(result.contentType).toBe("COURSEWARE");
  });

  test("maps row with opt-in (not opted out)", () => {
    const row: CSVRow = { ...baseRow, optout: "false" };
    const result = mapCSVToDTO(row);
    expect(result.optOut).toBe(false);
  });
});
