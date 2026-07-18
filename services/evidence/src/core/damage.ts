/**
 * Turn localized damage regions into the Twin's damage evidence: the regions
 * plus an overall visible-severity range. We report a range, never a repair
 * cost, because a photo cannot prove hidden damage.
 */
import type { DamageEvidence, DamageRegion, DamageSeverity } from '@sinistria/contracts';

/** Severity from least to most severe. The index is used as a rank. */
const SEVERITY_ORDER: readonly DamageSeverity[] = [
  'none',
  'cosmetic',
  'minor',
  'moderate',
  'severe',
];

/** Numeric rank of a severity, for comparisons. */
export function severityRank(severity: DamageSeverity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

/** The most severe of a set of regions, or 'none' when there are no regions. */
export function maxSeverity(regions: DamageRegion[]): DamageSeverity {
  return regions.reduce<DamageSeverity>(
    (worst, region) =>
      severityRank(region.severity) > severityRank(worst) ? region.severity : worst,
    'none',
  );
}

/** Build the damage evidence section from localized regions. */
export function buildDamageEvidence(regions: DamageRegion[]): DamageEvidence {
  if (regions.length === 0) {
    return {
      regions: [],
      severityRange: { min: 'none', max: 'none' },
      notes: 'No damage image has been analyzed yet.',
    };
  }

  const min = regions.reduce<DamageSeverity>(
    (best, region) => (severityRank(region.severity) < severityRank(best) ? region.severity : best),
    'severe',
  );

  return {
    regions,
    severityRange: { min, max: maxSeverity(regions) },
  };
}
