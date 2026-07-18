/**
 * The Accident Evidence Twin: the canonical, structured, auditable
 * reconstruction of a claim. This is the single most important object in the
 * system. Every service reads and writes parts of it; nothing redefines it.
 */
import { z } from 'zod';
import {
  anomalyTypeSchema,
  claimRouteSchema,
  claimStateSchema,
  damageSeveritySchema,
  escalationReasonSchema,
  impactAreaSchema,
  localeSchema,
} from './enums.js';
import { auditEntrySchema, confidenceSchema, evidenced } from './primitives.js';

/** A vehicle involved in the accident. */
export const vehicleSchema = z.object({
  plate: z.string(),
  makeModel: z.string().optional(),
  isClaimant: z.boolean(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

/** Actors, vehicles, time, and place. The "who, where, when". */
export const structuredFactsSchema = z.object({
  claimantStatement: evidenced(z.string()),
  occurredAt: evidenced(z.string().datetime()),
  location: evidenced(z.string()),
  vehicles: z.array(vehicleSchema).min(1),
});
export type StructuredFacts = z.infer<typeof structuredFactsSchema>;

/** The sequence of events and the collision direction. */
export const eventTimelineSchema = z.object({
  summary: evidenced(z.string()),
  sequence: z.array(z.string()).min(1),
  collisionDirection: evidenced(impactAreaSchema),
});
export type EventTimeline = z.infer<typeof eventTimelineSchema>;

/** One localized region of visible damage. */
export const damageRegionSchema = z.object({
  area: impactAreaSchema,
  severity: damageSeveritySchema,
  confidence: confidenceSchema,
});
export type DamageRegion = z.infer<typeof damageRegionSchema>;

/** Visible damage as localized regions plus an overall severity range. */
export const damageEvidenceSchema = z.object({
  regions: z.array(damageRegionSchema),
  severityRange: z.object({
    min: damageSeveritySchema,
    max: damageSeveritySchema,
  }),
  notes: z.string().optional(),
});
export type DamageEvidence = z.infer<typeof damageEvidenceSchema>;

/** A policy clause matched to the claim. */
export const policyClauseSchema = z.object({
  clauseId: z.string(),
  title: z.string(),
  text: z.string(),
  kind: z.enum(['coverage', 'exclusion']),
});
export type PolicyClause = z.infer<typeof policyClauseSchema>;

/** Coverage grounded in the insurer's own policy language. */
export const coverageEvidenceSchema = z.object({
  policyId: z.string(),
  covered: z.boolean(),
  matchedClauses: z.array(policyClauseSchema),
  confidence: confidenceSchema,
});
export type CoverageEvidence = z.infer<typeof coverageEvidenceSchema>;

/** A single cross-modal consistency check (story vs image vs document). */
export const consistencyCheckSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['consistent', 'inconsistent', 'benign_gap']),
  detail: z.string(),
});
export type ConsistencyCheck = z.infer<typeof consistencyCheckSchema>;

/** The outcome of all consistency checks. */
export const consistencyEvidenceSchema = z.object({
  checks: z.array(consistencyCheckSchema),
  contradictions: z.number().int().min(0),
  benignGaps: z.number().int().min(0),
});
export type ConsistencyEvidence = z.infer<typeof consistencyEvidenceSchema>;

/** How complete the evidence is, and what to capture next. */
export const completenessSchema = z.object({
  score: z.number().int().min(0).max(100),
  missing: z.array(z.string()),
  nextBestPrompt: z.string().optional(),
});
export type Completeness = z.infer<typeof completenessSchema>;

/** A relationship-graph anomaly. Describes an evidence pattern, never accuses a person. */
export const anomalyFlagSchema = z.object({
  type: anomalyTypeSchema,
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  relatedClaimId: z.string().optional(),
});
export type AnomalyFlag = z.infer<typeof anomalyFlagSchema>;

/**
 * A node in the relationship-graph view: the claim under review, or an entity
 * it shares with another claim. `type` is intentionally limited to what the
 * seeded graph can actually back today (see improvements P2.3 / decision log);
 * it grows only when the seed data grows with it.
 */
export const graphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['claim', 'phone']),
  label: z.string(),
  /** Whether this node is the claim under review, so the cockpit can highlight it. */
  isFocus: z.boolean(),
});
export type GraphNode = z.infer<typeof graphNodeSchema>;

/** A relationship between two graph nodes. `relation` is neutral: it names the shared evidence, never a person. */
export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relation: z.string(),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

/** The relationship-graph view for one claim. Empty when nothing was found. */
export const graphViewSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});
export type GraphView = z.infer<typeof graphViewSchema>;

/** The prepared recommendation. A human still owns the decision. */
export const recommendationSchema = z.object({
  route: claimRouteSchema,
  reasons: z.array(z.string()).min(1),
  escalationReasons: z.array(escalationReasonSchema),
  confidence: confidenceSchema,
  draftCustomerMessage: z.string(),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * The full Twin. Sections are populated as the claim moves through the pipeline,
 * so most are nullable until the owning service has run.
 */
export const accidentEvidenceTwinSchema = z.object({
  claimId: z.string(),
  correlationId: z.string(),
  state: claimStateSchema,
  locale: localeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  structuredFacts: structuredFactsSchema.nullable(),
  timeline: eventTimelineSchema.nullable(),
  damage: damageEvidenceSchema.nullable(),
  coverage: coverageEvidenceSchema.nullable(),
  consistency: consistencyEvidenceSchema.nullable(),
  completeness: completenessSchema.nullable(),
  anomalies: z.array(anomalyFlagSchema),
  graphView: graphViewSchema.nullable(),
  recommendation: recommendationSchema.nullable(),

  overallConfidence: confidenceSchema,
  audit: z.array(auditEntrySchema),
});
export type AccidentEvidenceTwin = z.infer<typeof accidentEvidenceTwinSchema>;
