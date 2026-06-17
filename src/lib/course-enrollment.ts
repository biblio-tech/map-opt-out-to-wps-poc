import type { Config } from "../config";
import type { Enrollment } from "../types";
import { getEnrollments } from "./api";
import { getAppLogger } from "./logger";

function isNotFoundError(error: string): boolean {
  return /no (student|enrollment) information found/i.test(error);
}

interface StudentEnrollmentEntry {
  crns: Set<string>;
}

export class EnrollmentLookup {
  private cache = new Map<string, StudentEnrollmentEntry>();

  private key(termCode: string, studentId: string): string {
    return `${termCode}|${studentId}`;
  }

  private async fetch(
    config: Config,
    termCode: string,
    studentId: string
  ): Promise<StudentEnrollmentEntry> {
    const logger = getAppLogger();
    const response = await getEnrollments(config, termCode, studentId);

    const entry: StudentEnrollmentEntry = { crns: new Set() };

    if (response.error) {
      if (response.status === 404 || isNotFoundError(response.error)) {
        return entry;
      }
      logger.warn`getEnrollments(${termCode}, ${studentId}) failed: ${response.status} - ${response.error}`;
      return entry;
    }

    const enrollments: Enrollment[] = response.data?.enrollments ?? [];
    for (const e of enrollments) {
      if (e.crn) entry.crns.add(e.crn);
    }

    return entry;
  }

  async get(
    config: Config,
    termCode: string,
    studentId: string
  ): Promise<StudentEnrollmentEntry> {
    const k = this.key(termCode, studentId);
    const cached = this.cache.get(k);
    if (cached) return cached;
    const entry = await this.fetch(config, termCode, studentId);
    this.cache.set(k, entry);
    return entry;
  }
}

export async function isEnrolled(
  lookup: EnrollmentLookup,
  config: Config,
  termCode: string,
  studentId: string,
  crn: string
): Promise<boolean> {
  const entry = await lookup.get(config, termCode, studentId);
  return entry.crns.has(crn);
}

