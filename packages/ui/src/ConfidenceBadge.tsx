import type { ConfidenceLabel } from '@sinistria/contracts';

/**
 * A colored pill for a confidence label. The product rule is that a score is
 * never shown naked; this is the one place that rule is expressed in markup,
 * so every confidence value in either app renders through it.
 */
export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLabel }) {
  return <span className={`badge badge-confidence-${confidence}`}>{confidence}</span>;
}
