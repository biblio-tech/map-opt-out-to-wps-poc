import type { CSVRow, OptInOptOutDTO } from "../types";
import type { TermCodeMapping } from "./term-mapping";
import { mapTermCode } from "./term-mapping";

export function mapContentType(contenttype: string): string {
  const normalized = contenttype.toLowerCase().trim();
  if (normalized === "ebook") {
    return "DIGITAL";
  }
  if (normalized === "courseware") {
    return "COURSEWARE";
  }
  return "PHYSICAL";
}

export function parseOptOut(optout: string): boolean {
  const normalized = optout.toLowerCase().trim();
  return normalized === "opted out" || normalized === "true";
}

export function parseCourseAndSectionCode(
  courseandsectioncode: string
): { departmentCode: string; courseCode: string; sectionCode: string } {
  // Format: "SW-685-MOL2" -> departmentCode: "SW", courseCode: "685", sectionCode: "MOL2"
  const parts = courseandsectioncode.split("-");

  if (parts.length >= 3) {
    return {
      departmentCode: parts[0],
      courseCode: parts[1],
      sectionCode: parts.slice(2).join("-"),
    };
  }

  if (parts.length === 2) {
    return {
      departmentCode: parts[0],
      courseCode: parts[1],
      sectionCode: "",
    };
  }

  return {
    departmentCode: courseandsectioncode,
    courseCode: "",
    sectionCode: "",
  };
}

export class UnmappedTermCodeError extends Error {
  constructor(public readonly csvTerm: string) {
    super(`No mapping found for term code: "${csvTerm}"`);
    this.name = "UnmappedTermCodeError";
  }
}

export function mapCSVToDTO(
  row: CSVRow,
  termMapping: TermCodeMapping
): OptInOptOutDTO {
  const { departmentCode, courseCode, sectionCode } = parseCourseAndSectionCode(
    row.courseandsectioncode
  );

  const termCode = mapTermCode(row.term, termMapping);
  if (termCode === null) {
    throw new UnmappedTermCodeError(row.term);
  }

  return {
    termCode,
    crn: row.crn,
    departmentCode,
    courseCode,
    sectionCode,
    studentId: row.studentid,
    firsName: row.firstname, // Note: API typo - "firsName" not "firstName"
    lastName: row.lastname,
    email: row.email,
    itemScanCode: row.ISBN,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    optOut: parseOptOut(row.optout),
    contentType: mapContentType(row.contenttype),
  };
}
