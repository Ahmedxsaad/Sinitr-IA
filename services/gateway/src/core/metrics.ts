/**
 * Live metrics for the cockpit (see improvements P2.6). Aggregated on read
 * from the same claim records the queue already serves, so every number shown
 * traces back to a real claim that ran through the pipeline. This counts as
 * the gateway's permitted "aggregate responses" role, not business logic: it
 * summarizes what other services already decided, it decides nothing itself.
 */
import type { AccidentEvidenceTwin, ClaimRoute, MetricsResult } from '@sinistria/contracts';
import type { ClaimRecord } from './store.js';

/** Milliseconds between the claim being opened and intake structuring it, or `null` if either audit entry is missing. */
function timeToFnolMs(twin: AccidentEvidenceTwin): number | null {
  const created = twin.audit.find((entry) => entry.action === 'claim.created');
  const structured = twin.audit.find((entry) => entry.action === 'intake.structured');
  if (!created || !structured) return null;
  return new Date(structured.at).getTime() - new Date(created.at).getTime();
}

/** The mean of a list of numbers, or `null` for an empty list rather than a misleading zero. */
function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Aggregate live metrics from the current set of claim records. */
export function computeMetrics(records: ClaimRecord[]): MetricsResult {
  const timesToFnol = records
    .map((record) => timeToFnolMs(record.twin))
    .filter((value): value is number => value !== null);

  const completenessScores = records
    .map((record) => record.twin.completeness?.score)
    .filter((value): value is number => value !== undefined);

  const routeCounts: Record<ClaimRoute, number> = { fast_track: 0, review: 0, investigate: 0 };
  for (const record of records) {
    const route = record.twin.recommendation?.route;
    if (route) routeCounts[route] += 1;
  }

  return {
    totalClaims: records.length,
    averageTimeToFnolMs: average(timesToFnol),
    averageEvidenceCompleteness: average(completenessScores),
    routeCounts,
  };
}
