import type { Adoption } from "../types";
import type { TermCodeMapping } from "./term-mapping";
import { mapTermCode } from "./term-mapping";
import { parseCourseAndSectionCode } from "./mapper";
import { getAppLogger } from "./logger";

export type CourseChargeTermMapping = Record<string, string>;

export function parseCostToStudent(price: string): number {
  const stripped = price.replace(/^\$/, "");
  const value = parseFloat(stripped);
  return Number.isNaN(value) ? 0 : value;
}

export function mapCourseChargeToAdoption(
  record: Record<string, string>,
  courseChargeTermMapping: CourseChargeTermMapping,
  termCodeMapping: TermCodeMapping
): Adoption | null {
  const logger = getAppLogger();

  const term = record["Term"];
  if (!term || term === "#N/A") {
    return null;
  }

  const canonicalTerm = courseChargeTermMapping[term];
  if (!canonicalTerm) {
    logger.warn`Unmapped course-charge term: "${term}"`;
    return null;
  }

  const termCode = mapTermCode(canonicalTerm, termCodeMapping);
  if (!termCode) {
    logger.warn`No term code found for canonical term: "${canonicalTerm}"`;
    return null;
  }

  const courseAndSection = record["Course Code"] ?? "";
  const { departmentCode, courseCode, sectionCode } =
    parseCourseAndSectionCode(courseAndSection);

  return {
    termCode,
    crn: record["CRN"],
    deptCode: departmentCode,
    courseCode,
    section: sectionCode,
    costToStudent: parseCostToStudent(record["BibliU Pricing"] ?? "0"),
    itemScanCode: record["Req. ISBN"],
    itemName: record["Title"],
  };
}
