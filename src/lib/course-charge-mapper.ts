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

export type MapResult =
  | { adoption: Adoption; skipReason?: undefined }
  | { adoption?: undefined; skipReason: string };

export function mapCourseChargeToAdoption(
  record: Record<string, string>,
  courseChargeTermMapping: CourseChargeTermMapping,
  termCodeMapping: TermCodeMapping
): MapResult {
  const logger = getAppLogger();

  const term = record["Term"];
  if (!term) {
    return { skipReason: "empty term" };
  }
  if (term === "#N/A") {
    return { skipReason: "term is #N/A (no term assigned)" };
  }

  const canonicalTerm = courseChargeTermMapping[term];
  if (!canonicalTerm) {
    logger.warn`Unmapped course-charge term: "${term}"`;
    return { skipReason: `unmapped course-charge term: "${term}"` };
  }

  const termCode = mapTermCode(canonicalTerm, termCodeMapping);
  if (!termCode) {
    logger.warn`No term code found for canonical term: "${canonicalTerm}"`;
    return { skipReason: `unmapped term code: "${canonicalTerm}"` };
  }

  const courseAndSection = record["Course Code"] ?? "";
  const { departmentCode, courseCode, sectionCode } =
    parseCourseAndSectionCode(courseAndSection);

  return {
    adoption: {
      termCode,
      crn: record["CRN"],
      deptCode: departmentCode,
      courseCode,
      section: sectionCode,
      costToStudent: parseCostToStudent(record["BibliU Pricing"] ?? "0"),
      itemScanCode: record["Req. ISBN"],
      itemName: record["Title"],
    },
  };
}
