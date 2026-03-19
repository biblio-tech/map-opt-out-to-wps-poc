import { parseCSVRecords } from "./csv-parser";

const ENROLLMENT_PATH = "data/CourseEnrollment.csv";

export interface StudentDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export interface CourseEnrollmentLookup {
  /** Set of "studentId|crn" keys */
  byStudentAndCRN: Set<string>;
  /** Map of "studentId|courseAndSection" → CRN */
  byCourseAndStudent: Map<string, string>;
  /** Map of studentId → student contact details */
  studentDetails: Map<string, StudentDetails>;
  totalRecords: number;
}

export async function loadCourseEnrollment(): Promise<CourseEnrollmentLookup> {
  const records = await parseCSVRecords(ENROLLMENT_PATH);

  const byStudentAndCRN = new Set<string>();
  const byCourseAndStudent = new Map<string, string>();
  const studentDetails = new Map<string, StudentDetails>();

  for (const r of records) {
    byStudentAndCRN.add(`${r["StudentId"]}|${r["CRN"]}`);
    byCourseAndStudent.set(
      `${r["StudentId"]}|${r["CourseAndSectionCode"]}`,
      r["CRN"]!
    );
    if (!studentDetails.has(r["StudentId"]!)) {
      studentDetails.set(r["StudentId"]!, {
        firstName: r["FirstName"] ?? "",
        lastName: r["LastName"] ?? "",
        email: r["EmailAddress"] ?? "",
      });
    }
  }

  return { byStudentAndCRN, byCourseAndStudent, studentDetails, totalRecords: records.length };
}

export function isEnrolled(
  lookup: CourseEnrollmentLookup,
  studentId: string,
  crn: string
): boolean {
  return lookup.byStudentAndCRN.has(`${studentId}|${crn}`);
}

export function getStudentDetails(
  lookup: CourseEnrollmentLookup,
  studentId: string
): StudentDetails | undefined {
  return lookup.studentDetails.get(studentId);
}

export function suggestCRN(
  lookup: CourseEnrollmentLookup,
  studentId: string,
  courseAndSection: string
): string | undefined {
  return lookup.byCourseAndStudent.get(`${studentId}|${courseAndSection}`);
}
