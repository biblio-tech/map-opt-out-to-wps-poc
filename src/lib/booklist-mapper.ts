import type { Adoption } from "../types";

export function mapBooklistToAdoption(
  record: Record<string, string>,
  termCode: string
): Adoption {
  return {
    termCode,
    crn: record["CRN"],
    deptCode: record["DepartmentCode*"],
    courseCode: record["CourseCode*"],
    section: record["SectionCode*"],
    costToStudent: 0,
    publisher: record["Publisher*"],
    itemScanCode: record["Requested ISBN*"],
    itemName: record["Title*"],
  };
}
