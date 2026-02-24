import type { Config } from "../config";
import type { Enrollment, EnrollmentWrapper } from "../types";
import { getEnrollment } from "./api";
import { getAppLogger } from "./logger";

export function enrollmentKey(
  termCode: string,
  deptCode: string,
  courseCode: string,
  section: string,
  customer: string
): string {
  return `${termCode}|${deptCode}|${courseCode}|${section}|${customer}`;
}

export class EnrollmentCache {
  private checked = new Set<string>();

  has(key: string): boolean {
    return this.checked.has(key);
  }

  add(key: string): void {
    this.checked.add(key);
  }

  get size(): number {
    return this.checked.size;
  }
}

export async function checkEnrollment(
  config: Config,
  termCode: string,
  studentId: string,
  course: { deptCode: string; courseCode: string; section: string },
  cache: EnrollmentCache
): Promise<void> {
  const logger = getAppLogger();
  const key = enrollmentKey(
    termCode,
    course.deptCode,
    course.courseCode,
    course.section,
    studentId
  );

  if (cache.has(key)) {
    return;
  }

  const result = await getEnrollment(config, termCode, studentId);

  if (result.status === 200 && result.data) {
    const wrapper = result.data as EnrollmentWrapper;
    if (wrapper.enrollments && wrapper.enrollments.length > 0) {
      for (const e of wrapper.enrollments) {
        if (e.termCode && e.deptCode && e.courseCode && e.section && e.customer) {
          cache.add(
            enrollmentKey(e.termCode, e.deptCode, e.courseCode, e.section, e.customer)
          );
        }
      }
      if (cache.has(key)) {
        return;
      }
    }
  }

  logger.debug`Student ${studentId} not enrolled in ${course.deptCode}-${course.courseCode}-${course.section} for term ${termCode}`;
}
