/**
 * Closed vocabularies shared across every service and app. Defining them as Zod
 * enums gives us both runtime validation and inferred TypeScript union types
 * from a single declaration, so no service can invent its own spelling.
 */
import { z } from 'zod';

/** Languages the customer can be served in. Derja is the default, French the fallback. */
export const localeSchema = z.enum(['derja', 'ar', 'fr']);
export type Locale = z.infer<typeof localeSchema>;

/**
 * The claim lifecycle. Every service moves a claim forward through these states.
 * `escalated` is a terminal branch reached whenever a trust gate fires.
 */
export const claimStateSchema = z.enum([
  'capturing', // customer is providing voice, photos, and documents
  'reconstructing', // evidence service is building the Twin
  'verifying', // consistency and anomaly checks are running
  'recommended', // a route is ready and waiting for a human
  'decided', // the adjuster has acted
  'notified', // the customer has been informed
  'escalated', // routed out of automation to a human
]);
export type ClaimState = z.infer<typeof claimStateSchema>;

/** Where a claim is routed after preparation. Never decided by the machine alone. */
export const claimRouteSchema = z.enum(['fast_track', 'review', 'investigate']);
export type ClaimRoute = z.infer<typeof claimRouteSchema>;

/** Human-readable confidence. We show the label, never a naked numeric score. */
export const confidenceLabelSchema = z.enum(['high', 'medium', 'low']);
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;

/** Where a piece of information originally came from. Attached to every derived field. */
export const provenanceSourceSchema = z.enum([
  'voice',
  'image',
  'document',
  'metadata',
  'policy',
  'derived',
]);
export type ProvenanceSource = z.infer<typeof provenanceSourceSchema>;

/** Side of a vehicle, used for both collision direction and damage location. */
export const impactAreaSchema = z.enum([
  'front',
  'front_left',
  'front_right',
  'rear',
  'rear_left',
  'rear_right',
  'left',
  'right',
  'unknown',
]);
export type ImpactArea = z.infer<typeof impactAreaSchema>;

/** Coarse visible-damage severity. A range of these is reported, never a repair cost. */
export const damageSeveritySchema = z.enum(['none', 'cosmetic', 'minor', 'moderate', 'severe']);
export type DamageSeverity = z.infer<typeof damageSeveritySchema>;

/** The reasons a claim is pulled out of the automation path and handed to a human. */
export const escalationReasonSchema = z.enum([
  'injury_or_safety',
  'disputed_liability',
  'low_confidence',
  'potential_hidden_damage',
  'contradictory_evidence',
  'unusual_pattern',
]);
export type EscalationReason = z.infer<typeof escalationReasonSchema>;

/** Anomaly categories surfaced by the relationship graph. These flag evidence, not people. */
export const anomalyTypeSchema = z.enum([
  'reused_image',
  'shared_garage_phone',
  'invoice_mismatch',
  'duplicate_claim',
]);
export type AnomalyType = z.infer<typeof anomalyTypeSchema>;

/** The action an adjuster can take from the cockpit. A financial decision needs a human. */
export const adjusterActionSchema = z.enum([
  'approve',
  'request_clarification',
  'open_investigation',
]);
export type AdjusterAction = z.infer<typeof adjusterActionSchema>;
