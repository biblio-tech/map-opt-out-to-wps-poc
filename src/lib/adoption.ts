import type { Config } from "../config";
import type { Adoption, OptInOptOutDTO } from "../types";
import { getAdoptionFiltered, postAdoption } from "./api";
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

export function dtoToAdoption(dto: OptInOptOutDTO): Adoption {
  return {
    termCode: dto.termCode,
    crn: dto.crn,
    deptCode: dto.departmentCode!,
    courseCode: dto.courseCode!,
    section: dto.sectionCode!,
    costToStudent: 0,
    publisher: dto.publisher,
    itemScanCode: dto.itemScanCode!,
    itemName: dto.title!,
  };
}

export class AdoptionCache {
  private confirmed = new Set<string>();

  has(key: string): boolean {
    return this.confirmed.has(key);
  }

  add(key: string): void {
    this.confirmed.add(key);
  }

  get size(): number {
    return this.confirmed.size;
  }
}

export async function ensureAdoption(
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

  logger.info`Creating adoption for ${deptCode}-${courseCode}-${section} ISBN ${itemScanCode} in term ${termCode}`;

  const adoption = dtoToAdoption(dto);
  const postResult = await postAdoption(config, termCode, adoption);

  if (postResult.status === 200) {
    cache.add(key);
    return true;
  }

  logger.error`Adoption creation failed: ${postResult.status} - ${postResult.error}`;
  return false;
}
