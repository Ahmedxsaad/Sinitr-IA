/**
 * Small building blocks reused across the Twin: confidence, provenance, the
 * `evidenced` wrapper that forces every model-derived value to carry its source
 * and confidence, and the audit entry.
 */
import { z } from 'zod';
import { confidenceLabelSchema, provenanceSourceSchema } from './enums.js';

/**
 * A confidence value. `label` is what the cockpit displays. `score` is optional
 * internal detail (0 to 1) that a service may use for thresholds but the UI must
 * not present as a naked number.
 */
export const confidenceSchema = z.object({
  label: confidenceLabelSchema,
  score: z.number().min(0).max(1).optional(),
});
export type Confidence = z.infer<typeof confidenceSchema>;

/**
 * Derive a Confidence from a numeric score using the shared labeling
 * thresholds. Keeping this next to the type means every service maps scores to
 * labels the same way, so "high" always means the same thing in the cockpit.
 *
 * @param score - a value from 0 to 1 (clamped if out of range).
 */
export function makeConfidence(score: number): Confidence {
  const clamped = Math.min(1, Math.max(0, score));
  const label = clamped >= 0.75 ? 'high' : clamped >= 0.5 ? 'medium' : 'low';
  return { label, score: clamped };
}

/**
 * Wrap any value schema so it cannot be added to the Twin without stating where
 * it came from and how confident we are. This is the schema-level enforcement of
 * the rule "every derived field carries provenance and a confidence label".
 *
 * @param valueSchema - the schema for the underlying value being evidenced.
 * @returns an object schema of { value, source, confidence }.
 */
export function evidenced<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    source: provenanceSourceSchema,
    confidence: confidenceSchema,
  });
}

/** Convenience aliases for the evidenced values used most often. */
export const evidencedStringSchema = evidenced(z.string());
export type EvidencedString = z.infer<typeof evidencedStringSchema>;

/** One immutable line in the claim's audit trail. Appended, never edited. */
export const auditEntrySchema = z.object({
  at: z.string().datetime(),
  actor: z.string(), // service name or adjuster handle
  action: z.string(),
  detail: z.string().optional(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;
