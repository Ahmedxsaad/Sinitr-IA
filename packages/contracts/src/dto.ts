/**
 * Request and response payloads for every service boundary. Each service
 * validates its input against these schemas at the edge, so a malformed call
 * fails at the boundary instead of deep inside business logic.
 */
import { z } from 'zod';
import { adjusterActionSchema, claimRouteSchema, impactAreaSchema, localeSchema } from './enums.js';
import { confidenceSchema, evidenced } from './primitives.js';
import {
  anomalyFlagSchema,
  completenessSchema,
  consistencyEvidenceSchema,
  coverageEvidenceSchema,
  damageEvidenceSchema,
  eventTimelineSchema,
  graphViewSchema,
  recommendationSchema,
  structuredFactsSchema,
} from './twin.js';

/**
 * Every internal call carries the claim id and the correlation id so the audit
 * trail, the cockpit reasons, and the live metrics all share one trace.
 */
export const traceSchema = z.object({
  claimId: z.string().min(1).max(128),
  correlationId: z.string().min(1).max(128),
});
export type Trace = z.infer<typeof traceSchema>;

/** Customer-supplied contact details. Kept minimal by data-minimization design. */
export const contactSchema = z.object({
  phone: z.string().trim().min(3).max(32),
});
export type Contact = z.infer<typeof contactSchema>;

/** Mobile app to gateway: open a new claim. */
export const createClaimRequestSchema = z.object({
  locale: localeSchema,
  narrative: z.string().trim().min(1).max(10_000), // stands in for the voice transcript in the mock
  // Answer to the first guided question, "is anyone injured or in danger?".
  // Collected explicitly rather than guessed from free text, because safety
  // must not depend on fragile keyword parsing.
  injuryReported: z.boolean(),
  collisionDirection: impactAreaSchema.optional(),
  contact: contactSchema,
  // Submission is only valid after the customer confirms the interpreted facts.
  // An unconfirmed report must stay in the guided flow instead of entering
  // claim processing with facts the customer has not accepted.
  confirmed: z.literal(true),
  mediaRefs: z.array(z.string().trim().min(1).max(512)).max(100).default([]),
  garagePhone: z.string().trim().min(3).max(32).optional(), // present only in the suspicious demo case
  seedCaseId: z.string().trim().min(1).max(128).optional(), // selects a scripted fixture in demo mode
});
export type CreateClaimRequest = z.infer<typeof createClaimRequestSchema>;

/** The extracted first notice of loss produced by intake. */
export const fnolSchema = z.object({
  structuredFacts: structuredFactsSchema,
  timeline: eventTimelineSchema,
});
export type Fnol = z.infer<typeof fnolSchema>;

/** The outcome of the safety and eligibility gates. */
export const gateResultSchema = z.object({
  safetyPassed: z.boolean(),
  eligibilityPassed: z.boolean(),
  reasons: z.array(z.string()), // human-readable reasons a gate failed
});
export type GateResult = z.infer<typeof gateResultSchema>;

/** Gateway to intake. */
export const intakeRequestSchema = traceSchema.extend({
  locale: localeSchema,
  narrative: z.string().trim().min(1).max(10_000),
  injuryReported: z.boolean(),
  collisionDirection: impactAreaSchema.optional(),
  confirmed: z.literal(true),
  mediaRefs: z.array(z.string().trim().min(1).max(512)).max(100),
});
export type IntakeRequest = z.infer<typeof intakeRequestSchema>;

/** Intake to gateway. */
export const intakeResultSchema = z.object({
  transcript: evidenced(z.string()),
  fnol: fnolSchema,
  gates: gateResultSchema,
});
export type IntakeResult = z.infer<typeof intakeResultSchema>;

/** Gateway to evidence. */
export const evidenceRequestSchema = traceSchema.extend({
  fnol: fnolSchema,
  mediaRefs: z.array(z.string()),
});
export type EvidenceRequest = z.infer<typeof evidenceRequestSchema>;

/** Evidence to gateway. */
export const evidenceResultSchema = z.object({
  damage: damageEvidenceSchema,
  consistency: consistencyEvidenceSchema,
  completeness: completenessSchema,
});
export type EvidenceResult = z.infer<typeof evidenceResultSchema>;

/** Gateway to graph. */
export const graphRequestSchema = traceSchema.extend({
  claimantPhone: z.string().trim().min(3).max(32),
  garagePhone: z.string().trim().min(3).max(32).optional(),
  mediaRefs: z.array(z.string().trim().min(1).max(512)).max(100),
});
export type GraphRequest = z.infer<typeof graphRequestSchema>;

/** Graph to gateway. */
export const graphResultSchema = z.object({
  anomalies: z.array(anomalyFlagSchema),
  view: graphViewSchema,
});
export type GraphResult = z.infer<typeof graphResultSchema>;

/** Gateway to claims: everything needed to ground coverage and recommend a route. */
export const recommendRequestSchema = traceSchema.extend({
  fnol: fnolSchema,
  evidence: evidenceResultSchema,
  anomalies: z.array(anomalyFlagSchema),
  gates: gateResultSchema,
});
export type RecommendRequest = z.infer<typeof recommendRequestSchema>;

/** Claims to gateway. */
export const recommendResultSchema = z.object({
  coverage: coverageEvidenceSchema,
  recommendation: recommendationSchema,
  overallConfidence: confidenceSchema,
});
export type RecommendResult = z.infer<typeof recommendResultSchema>;

/** Gateway to notify. */
export const notifyRequestSchema = traceSchema.extend({
  route: claimRouteSchema,
  phone: z.string().trim().min(3).max(32),
  message: z.string().trim().min(1).max(1_600),
});
export type NotifyRequest = z.infer<typeof notifyRequestSchema>;

/** Notify to gateway. */
export const notifyResultSchema = z.object({
  status: z.enum(['sent', 'queued', 'offline_fallback']),
  channel: z.literal('sms'),
  messageId: z.string(),
  sentAt: z.string().datetime(),
});
export type NotifyResult = z.infer<typeof notifyResultSchema>;

/** Cockpit to gateway: the adjuster acts on a prepared claim. */
export const adjusterDecisionRequestSchema = z.object({
  action: adjusterActionSchema,
  note: z.string().optional(),
});
export type AdjusterDecisionRequest = z.infer<typeof adjusterDecisionRequestSchema>;

/**
 * Gateway to cockpit: live aggregates over every claim processed this session
 * (see improvements P2.6). Averages are `null` until at least one claim
 * contributes a value, so the cockpit can show "not enough data yet" instead
 * of a misleading zero.
 */
export const metricsResultSchema = z.object({
  totalClaims: z.number().int().min(0),
  averageTimeToFnolMs: z.number().min(0).nullable(),
  averageEvidenceCompleteness: z.number().min(0).max(100).nullable(),
  routeCounts: z.object({
    fast_track: z.number().int().min(0),
    review: z.number().int().min(0),
    investigate: z.number().int().min(0),
  }),
});
export type MetricsResult = z.infer<typeof metricsResultSchema>;
