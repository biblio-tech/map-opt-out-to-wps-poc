import type { Config } from "../config";
import type { Adoption } from "../types";
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

export interface ResolveAdoptionParams {
  crn: string;
  dept: string;
  course: string;
  section: string;
  itemScanCode: string;
}

export class AdoptionResolveCache {
  private resolved = new Map<string, Adoption>();
  private unresolved = new Set<string>();

  private key(params: ResolveAdoptionParams): string {
    return `${params.crn}|${params.dept}|${params.course}|${params.section}|${params.itemScanCode}`;
  }

  get(params: ResolveAdoptionParams): Adoption | undefined {
    return this.resolved.get(this.key(params));
  }

  isUnresolved(params: ResolveAdoptionParams): boolean {
    return this.unresolved.has(this.key(params));
  }

  set(params: ResolveAdoptionParams, adoption: Adoption): void {
    this.resolved.set(this.key(params), adoption);
  }

  addUnresolved(params: ResolveAdoptionParams): void {
    this.unresolved.add(this.key(params));
  }

  get unresolvedAdoptions(): string[] {
    return [...this.unresolved];
  }

  get size(): number {
    return this.resolved.size;
  }
}

export async function resolveAdoption(
  config: Config,
  params: ResolveAdoptionParams,
  candidateTerms: string[],
  cache: AdoptionResolveCache,
  preferredTerm?: string
): Promise<Adoption | null> {
  const logger = getAppLogger();

  const cached = cache.get(params);
  if (cached) {
    return cached;
  }

  if (cache.isUnresolved(params)) {
    return null;
  }

  const ordered = preferredTerm
    ? [preferredTerm, ...candidateTerms.filter((t) => t !== preferredTerm)]
    : candidateTerms;

  for (const term of ordered) {
    const result = await getAdoptionFiltered(config, term, {
      dept: params.dept,
      course: params.course,
      section: params.section,
      crn: params.crn,
      itemScanCode: params.itemScanCode,
    });

    if (result.status === 200 && result.data) {
      const adoptions = (result.data as { adoptions?: Adoption[] }).adoptions;
      if (adoptions && adoptions.length > 0) {
        const adoption = adoptions[0]!;
        if (!adoption.termCode) {
          adoption.termCode = term;
        }
        cache.set(params, adoption);
        logger.info`Resolved adoption for CRN ${params.crn} ISBN ${params.itemScanCode} in term ${adoption.termCode}`;
        return adoption;
      }
    }
  }

  logger.error`Could not resolve adoption for CRN ${params.crn} (dept ${params.dept}, course ${params.course}, section ${params.section}, ISBN ${params.itemScanCode}) in any candidate term`;
  cache.addUnresolved(params);
  return null;
}
