/**
 * Compute an overall confidence score for a prepared claim from the evidence
 * signals. Centralized so the route decision and the displayed confidence label
 * are derived from the same number.
 */

export interface ConfidenceSignals {
  /** Number of hard contradictions between story, image, and documents. */
  contradictions: number;
  /** Number of high-severity relationship anomalies. */
  highSeverityAnomalies: number;
  /** Evidence completeness from 0 to 100. */
  completeness: number;
  /** Whether the visible damage reached the severe band. */
  severeDamage: boolean;
}

/**
 * Fold the signals into a single 0 to 1 confidence score. Contradictions and
 * anomalies subtract the most; completeness scales the whole result so a sparse
 * file can never read as high confidence.
 */
export function computeConfidenceScore(signals: ConfidenceSignals): number {
  let score = 0.9;
  score -= signals.contradictions * 0.4;
  score -= signals.highSeverityAnomalies * 0.3;
  if (signals.severeDamage) score -= 0.2;
  score *= signals.completeness / 100;
  return Math.max(0, Math.min(1, score));
}
