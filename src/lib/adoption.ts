import type { Config } from "../config";
import type { Adoption, OptInOptOutDTO } from "../types";
import { getAdoptionFiltered } from "./api";
import { getAppLogger } from "./logger";

export function adoptionKey(
  termCode: string,
  deptCode: string,
  courseCode: string,
  section: string,
  itemScanCode: string
): string {
  return `${termCode}|${deptCode}|${courseCode}|${section}|${itemScanCode}`;
}

export class AdoptionCache {
  private confirmed = new Set<string>();
  private missing = new Set<string>();

  has(key: string): boolean {
    return this.confirmed.has(key);
  }

  isMissing(key: string): boolean {
    return this.missing.has(key);
  }

  add(key: string): void {
    this.confirmed.add(key);
  }

  addMissing(key: string): void {
    this.missing.add(key);
  }

  get missingKeys(): string[] {
    return [...this.missing];
  }

  get size(): number {
    return this.confirmed.size;
  }
}

export async function checkAdoptionExists(
  config: Config,
  dto: OptInOptOutDTO,
  cache: AdoptionCache
): Promise<boolean> {
  const logger = getAppLogger();
  const termCode = dto.termCode!;
  const deptCode = dto.departmentCode!;
  const courseCode = dto.courseCode!;
  const section = dto.sectionCode!;
  const itemScanCode = dto.itemScanCode!;

  const key = adoptionKey(termCode, deptCode, courseCode, section, itemScanCode);

  if (cache.has(key)) {
    return true;
  }

  if (cache.isMissing(key)) {
    return false;
  }

  const getResult = await getAdoptionFiltered(config, termCode, {
    dept: deptCode,
    course: courseCode,
    section,
    itemScanCode,
  });

  if (getResult.status === 200 && getResult.data) {
    const adoptions = getResult.data as { adoptions?: Adoption[] };
    if (adoptions.adoptions && adoptions.adoptions.length > 0) {
      for (const a of adoptions.adoptions) {
        cache.add(
          adoptionKey(
            termCode,
            a.deptCode,
            a.courseCode,
            a.section,
            a.itemScanCode
          )
        );
      }
      if (cache.has(key)) {
        return true;
      }
    }
  }

  logger.error`Missing adoption: ${deptCode}-${courseCode}-${section} ISBN ${itemScanCode} in term ${termCode}`;
  cache.addMissing(key);
  return false;
}
