import type { SignalCriticality } from '@sinistria/contracts';

/**
 * A colored pill for a signal's criticality. Shares the same green/amber/red
 * color language as RouteBadge and ConfidenceBadge (see tokens.css): low maps
 * to the trust-it green, medium to the check-it amber, and high and critical
 * both to the look-closely red, since the shared palette has three tiers.
 */
export function CriticalityBadge({ criticality }: { criticality: SignalCriticality }) {
  return <span className={`badge badge-criticality-${criticality}`}>{criticality}</span>;
}
