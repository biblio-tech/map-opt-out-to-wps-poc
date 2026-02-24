import { describe, expect, test } from "bun:test";
import { mapBooklistToAdoption } from "./booklist-mapper";

describe("mapBooklistToAdoption", () => {
  const record: Record<string, string> = {
    CRN: "235907",
    Department: "Business",
    "DepartmentCode*": "ACC",
    "CourseCode*": "201",
    "SectionCode*": "01",
    "Course Name*": "FINANCIAL ACCOUNTING",
    "Start Date*": "2025-08-25",
    "Census Date*": "2025-09-09",
    "End Date*": "2025-12-13",
    "Enrollment Cap*": "35",
    "Professor First Name": "Kevin",
    "Professor Last Name": "Kemerer",
    "Professor Email": "kkemerer@barry.edu",
    Type: "Courseware - LTI",
    "Requested ISBN*": "9781265321147",
    "Title*": "Financial Accounting, Connect (Custom)",
    "Author*": "Spiceland",
    "Publisher*": "MCGRAW HILL (CUSTOM PUBLISHING)",
    "Edition*": "6",
    "Access Length*": "180",
    "Confirmed Access Length": "180",
    aggregated_course_code: "ACC-201-01",
    "Conf. Edition": "6",
    Status: "Delivered",
    "Date Created": "2025-06-23 20:07:57.196246+00",
  };

  test("maps booklist fields to Adoption model", () => {
    const adoption = mapBooklistToAdoption(record, "2025FA");

    expect(adoption.termCode).toBe("2025FA");
    expect(adoption.crn).toBe("235907");
    expect(adoption.deptCode).toBe("ACC");
    expect(adoption.courseCode).toBe("201");
    expect(adoption.section).toBe("01");
    expect(adoption.itemScanCode).toBe("9781265321147");
    expect(adoption.itemName).toBe("Financial Accounting, Connect (Custom)");
    expect(adoption.publisher).toBe("MCGRAW HILL (CUSTOM PUBLISHING)");
  });

  test("uses provided termCode", () => {
    const adoption = mapBooklistToAdoption(record, "2026SP");
    expect(adoption.termCode).toBe("2026SP");
  });

  test("defaults costToStudent to 0", () => {
    const adoption = mapBooklistToAdoption(record, "2025FA");
    expect(adoption.costToStudent).toBe(0);
  });
});
