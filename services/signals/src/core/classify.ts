/**
 * Deterministic, rules-based classification of a raw news item into a signal
 * event. Keeping this as explicit keyword rules (rather than an LLM call) makes
 * the feature offline-safe and unit-testable, and it mirrors how the intake
 * gates already work: rules where they must be explainable. A live deployment
 * could swap in a hosted model behind the same function shape, but the rules
 * stay the deterministic default and the demo never depends on a model call.
 */
import {
  type RawNewsItem,
  type SignalCriticality,
  type SignalEvent,
  type SignalRegion,
  type SignalRelevance,
  makeConfidence,
} from '@sinistria/contracts';

/** A rule maps a set of keyword patterns to a criticality and the concerns it touches. */
interface ClassificationRule {
  patterns: RegExp;
  criticality: SignalCriticality;
  relevance: SignalRelevance[];
  assessment: string;
}

// Ordered most-severe first, so the first matching rule wins. Patterns cover
// French and English terms since the regional feeds mix both.
// Patterns tolerate common inflections (a trailing "s"/"ing"), because a strict
// word boundary after the stem would miss "floods" or "flooding". Kept explicit
// rather than stemming with `\w*`, which would over-match (for example
// "floodlight").
const RULES: readonly ClassificationRule[] = [
  {
    patterns:
      /\b(earthquakes?|s[eé]ismes?|tsunamis?|epidemics?|[eé]pid[eé]mies?|outbreaks?|cholera)\b/i,
    criticality: 'critical',
    relevance: ['health', 'property'],
    assessment:
      'Large-scale event that can drive a surge of claims; watch for related motor exposure.',
  },
  {
    patterns:
      /\b(floods?|flooding|inondations?|wildfires?|incendies?|storms?|temp[eê]tes?|explosions?)\b/i,
    criticality: 'high',
    relevance: ['property', 'transport'],
    assessment:
      'Property and vehicle damage likely in the affected area; corroborate claims from this time and place.',
  },
  {
    patterns:
      /\b(collisions?|pile-?ups?|carambolages?|accidents?|crash(?:es)?|motorway|autoroute|road closed|route coup[eé]e)\b/i,
    criticality: 'high',
    relevance: ['transport'],
    assessment: 'Road incident that may relate to motor claims in the area.',
  },
  {
    patterns: /\b(strikes?|gr[eè]ves?|protests?|manifestations?|closures?|disruptions?)\b/i,
    criticality: 'medium',
    relevance: ['transport', 'business'],
    assessment: 'Local disruption; minor relevance to motor exposure.',
  },
];

/** Combine the title and description into one lowercased haystack for matching. */
function haystack(item: RawNewsItem): string {
  return `${item.title} ${item.description}`;
}

/** A stable id for an event, derived from its URL so the same item classifies identically. */
function eventId(region: SignalRegion, item: RawNewsItem): string {
  const slug = item.url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');
  return `${region}:${slug}`;
}

/**
 * Classify one raw news item. An item that matches no rule is a low-criticality,
 * general signal: kept, but clearly the least urgent, never dropped silently.
 */
export function classifyEvent(region: SignalRegion, item: RawNewsItem): SignalEvent {
  const text = haystack(item);
  const matched = RULES.find((rule) => rule.patterns.test(text));

  const criticality: SignalCriticality = matched ? matched.criticality : 'low';
  const relevance: SignalRelevance[] = matched ? matched.relevance : ['general'];
  const assessment = matched
    ? matched.assessment
    : 'No motor-insurance relevance detected; shown for general awareness.';
  // A confident keyword match reads as high confidence; the catch-all fallback
  // is a low-confidence guess, and the label makes that visible.
  const confidence = makeConfidence(matched ? 0.8 : 0.3);

  return {
    id: eventId(region, item),
    region,
    title: item.title,
    summary: item.description,
    url: item.url,
    publishedAt: item.publishedAt,
    criticality,
    relevance,
    assessment,
    confidence,
  };
}

/** Numeric rank of a criticality, so events can be ordered most-serious first. */
const CRITICALITY_RANK: Record<SignalCriticality, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Sort classified events most-serious first. */
export function sortByCriticality(events: SignalEvent[]): SignalEvent[] {
  return [...events].sort(
    (a, b) => CRITICALITY_RANK[b.criticality] - CRITICALITY_RANK[a.criticality],
  );
}
