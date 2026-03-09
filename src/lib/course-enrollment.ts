import { parseCSVRecords } from "./csv-parser";

const ENROLLMENT_PATH = "data/CourseEnrollment.csv";

export interface CourseEnrollmentLookup {
  /** Set of "studentId|crn" keys */
  byStudentAndCRN: Set<string>;
  /** Map of "studentId|courseAndSection" → CRN */
  byCourseAndStudent: Map<string, string>;
  totalRecords: number;
}

export async function loadCourseEnrollment(): Promise<CourseEnrollmentLookup> {
  const records = await parseCSVRecords(ENROLLMENT_PATH);

  const byStudentAndCRN = new Set<string>();
  const byCourseAndStudent = new Map<string, string>();

  for (const r of records) {
    byStudentAndCRN.add(`${r["StudentId"]}|${r["CRN"]}`);
    byCourseAndStudent.set(
      `${r["StudentId"]}|${r["CourseAndSectionCode"]}`,
      r["CRN"]!
    );
  }

  return { byStudentAndCRN, byCourseAndStudent, totalRecords: records.length };
}

export function isEnrolled(
  lookup: CourseEnrollmentLookup,
  studentId: string,
  crn: string
): boolean {
  return lookup.byStudentAndCRN.has(`${studentId}|${crn}`);
}

export function suggestCRN(
  lookup: CourseEnrollmentLookup,
  studentId: string,
  courseAndSection: string
): string | undefined {
  return lookup.byCourseAndStudent.get(`${studentId}|${courseAndSection}`);
}
