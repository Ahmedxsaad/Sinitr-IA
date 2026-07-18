/**
 * Cross-modal consistency: does the spoken story match the visible damage, and
 * does the repair invoice match the damage. This is the reasoning that turns a
 * pile of inputs into a trustworthy reconstruction. It flags evidence, never
 * people, and uses neutral language.
 */
import type {
  ConsistencyCheck,
  ConsistencyEvidence,
  Fnol,
  ImpactArea,
  DamageRegion,
} from '@sinistria/contracts';
import type { ExtractedDocument } from '../adapters/ocr.js';
import { maxSeverity, severityRank } from './damage.js';

/** Repair categories that imply mechanical work rather than a light body repair. */
const MECHANICAL_CATEGORIES: readonly string[] = ['engine', 'mechanical', 'gearbox'];

/** The front/rear axis token of an area, if any. */
function majorAxis(area: ImpactArea): 'front' | 'rear' | null {
  if (area.startsWith('front')) return 'front';
  if (area.startsWith('rear')) return 'rear';
  return null;
}

/** Whether a stated collision direction is compatible with a damage area. */
export function areasConsistent(direction: ImpactArea, area: ImpactArea): boolean {
  // An unknown direction cannot contradict anything.
  if (direction === 'unknown') return true;
  if (direction === area) return true;
  const directionAxis = majorAxis(direction);
  const areaAxis = majorAxis(area);
  return directionAxis !== null && directionAxis === areaAxis;
}

/** Run every consistency check and summarize the outcome. */
export function checkConsistency(
  fnol: Fnol,
  regions: DamageRegion[],
  documents: ExtractedDocument[],
): ConsistencyEvidence {
  const checks: ConsistencyCheck[] = [];
  const direction = fnol.timeline.collisionDirection.value;

  // Check 1: stated collision direction versus visible damage location.
  if (regions.length === 0) {
    checks.push({
      id: 'direction_vs_damage',
      description: 'Stated collision direction matches the visible damage',
      status: 'benign_gap',
      detail: 'No damage image was available to compare against the narrative.',
    });
  } else {
    const consistent = regions.some((region) => areasConsistent(direction, region.area));
    checks.push({
      id: 'direction_vs_damage',
      description: 'Stated collision direction matches the visible damage',
      status: consistent ? 'consistent' : 'inconsistent',
      detail: consistent
        ? `The reported ${direction.replace('_', ' ')} impact matches the visible damage location.`
        : `The reported ${direction.replace('_', ' ')} impact does not match where the visible damage is concentrated.`,
    });
  }

  // Check 2: repair invoice versus visible damage severity.
  const invoice = documents.find((document) => document.type === 'invoice');
  if (!invoice) {
    checks.push({
      id: 'invoice_vs_damage',
      description: 'Repair invoice matches the visible damage',
      status: 'benign_gap',
      detail: 'No repair invoice was provided.',
    });
  } else {
    const lightDamage =
      regions.length > 0 && severityRank(maxSeverity(regions)) <= severityRank('minor');
    const mechanical = MECHANICAL_CATEGORIES.includes(invoice.category);
    const inconsistent = lightDamage && mechanical;
    checks.push({
      id: 'invoice_vs_damage',
      description: 'Repair invoice matches the visible damage',
      status: inconsistent ? 'inconsistent' : 'consistent',
      detail: inconsistent
        ? `Invoice category "${invoice.category}" does not match the light visible damage.`
        : `Invoice category "${invoice.category}" is consistent with the visible damage.`,
    });
  }

  return {
    checks,
    contradictions: checks.filter((check) => check.status === 'inconsistent').length,
    benignGaps: checks.filter((check) => check.status === 'benign_gap').length,
  };
}
