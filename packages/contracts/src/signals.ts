/**
 * External-signal types for the situational-awareness feature. A "signal" is a
 * public regional event (a flood, a road closure, a disease outbreak) that an
 * adjuster may want to be aware of while reviewing motor claims. This is an
 * additive, standalone surface: it does not enter the Accident Evidence Twin or
 * the claim pipeline. Per-claim corroboration (matching an event to one claim's
 * time and place) is a deliberate follow-up, not built here.
 *
 * Note the reframing from a generic news feed: criticality is a label, never a
 * naked numeric urgency score (the cockpit never shows a naked score), and the
 * language describes the event, it never speculates about a "business
 * opportunity".
 */
import { z } from 'zod';
import { confidenceSchema } from './primitives.js';

/** Regions the signal feed covers. Kept small and explicit like every other vocabulary. */
export const signalRegionSchema = z.enum(['tunisia', 'africa']);
export type SignalRegion = z.infer<typeof signalRegionSchema>;

/** How serious a regional event is. A label, shown as-is, never a raw number. */
export const signalCriticalitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type SignalCriticality = z.infer<typeof signalCriticalitySchema>;

/** Which motor-insurance concerns an event may touch. Neutral, coarse categories. */
export const signalRelevanceSchema = z.enum([
  'property',
  'transport',
  'health',
  'business',
  'general',
]);
export type SignalRelevance = z.infer<typeof signalRelevanceSchema>;

/**
 * A raw, unclassified news item as it arrives from a feed. This is the shape of
 * the seeded fixtures in `data/signals` and of a live RSS entry; the classifier
 * turns it into a `SignalEvent`.
 */
export const rawNewsItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  url: z.string().url(),
  publishedAt: z.string(),
});
export type RawNewsItem = z.infer<typeof rawNewsItemSchema>;

/** The seeded fixture file for one region: a list of raw news items. */
export const signalsFixtureSchema = z.object({
  region: signalRegionSchema,
  items: z.array(rawNewsItemSchema),
});
export type SignalsFixture = z.infer<typeof signalsFixtureSchema>;

/** A classified regional event, ready for the cockpit to display. */
export const signalEventSchema = z.object({
  id: z.string(),
  region: signalRegionSchema,
  title: z.string(),
  summary: z.string(),
  url: z.string().url(),
  publishedAt: z.string(),
  criticality: signalCriticalitySchema,
  relevance: z.array(signalRelevanceSchema),
  /** Neutral, one-line description of why the event may matter to motor cover. */
  assessment: z.string(),
  /** How confident the classifier is, carried as a label like every derived value. */
  confidence: confidenceSchema,
});
export type SignalEvent = z.infer<typeof signalEventSchema>;

/** Signals service to gateway: the classified events for a region. */
export const signalsResultSchema = z.object({
  region: signalRegionSchema,
  generatedAt: z.string(),
  events: z.array(signalEventSchema),
});
export type SignalsResult = z.infer<typeof signalsResultSchema>;
