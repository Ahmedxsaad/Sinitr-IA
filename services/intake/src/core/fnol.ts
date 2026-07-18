/**
 * Turn a transcript and the customer's guided answers into structured first
 * notice of loss fields: the actors and vehicles, the timeline, and the
 * collision direction. Deterministic and dependency-free so it is easy to test.
 */
import {
  type EventTimeline,
  type Fnol,
  type ImpactArea,
  type IntakeRequest,
  type StructuredFacts,
  makeConfidence,
} from '@sinistria/contracts';
import type { Transcript } from '../adapters/speech.js';

/** Ordered so that more specific phrases (rear left) win over general ones (rear). */
const DIRECTION_PATTERNS: ReadonlyArray<[RegExp, ImpactArea]> = [
  [/\b(arriere|arrière|rear|wara)\s*(gauche|left|yasar)\b/i, 'rear_left'],
  [/\b(arriere|arrière|rear|wara)\s*(droit|droite|right|ymin)\b/i, 'rear_right'],
  [/\b(avant|front|9odd?am|koddam)\s*(gauche|left|yasar)\b/i, 'front_left'],
  [/\b(avant|front|9odd?am|koddam)\s*(droit|droite|right|ymin)\b/i, 'front_right'],
  [/\b(arriere|arrière|rear|wara)\b/i, 'rear'],
  [/\b(avant|front|9odd?am|koddam)\b/i, 'front'],
  [/\b(gauche|left|yasar)\b/i, 'left'],
  [/\b(droit|droite|right|ymin)\b/i, 'right'],
];

/** Detect the collision direction from free text, or return 'unknown'. */
export function detectCollisionDirection(text: string): ImpactArea {
  for (const [pattern, area] of DIRECTION_PATTERNS) {
    if (pattern.test(text)) return area;
  }
  return 'unknown';
}

/** A Tunisian-style plate such as "125 TUN 4587", if the narrative mentions one. */
export function detectPlate(text: string): string | null {
  const match = text.match(/\b\d{2,4}\s?(?:tun|tu|tn)\s?\d{1,4}\b/i);
  return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : null;
}

/** A rough location phrase from the narrative, or null if none is recognizable. */
export function detectLocation(text: string): string | null {
  const match = text.match(/\b(feu rouge|rond[- ]point|autoroute|avenue|rue|carrefour)\b[^.,;]*/i);
  return match ? match[0].trim() : null;
}

/**
 * Build the structured facts. The collision direction from the customer's guided
 * answer takes priority over what we infer from the narrative.
 */
function buildStructuredFacts(transcript: Transcript): StructuredFacts {
  const plate = detectPlate(transcript.text);
  const location = detectLocation(transcript.text);

  return {
    claimantStatement: {
      value: transcript.text,
      source: 'voice',
      confidence: makeConfidence(transcript.confidence),
    },
    occurredAt: {
      // Device time is a reasonable proxy for a fresh roadside report.
      value: new Date().toISOString(),
      source: 'metadata',
      confidence: makeConfidence(0.8),
    },
    location: {
      value: location ?? 'Unknown',
      source: 'derived',
      confidence: makeConfidence(location ? 0.7 : 0.3),
    },
    vehicles: [
      {
        plate: plate ?? 'UNKNOWN',
        isClaimant: true,
      },
    ],
  };
}

/** Build the event timeline, preferring the guided answer for collision direction. */
function buildTimeline(transcript: Transcript, request: IntakeRequest): EventTimeline {
  const direction = request.collisionDirection ?? detectCollisionDirection(transcript.text);
  const directionConfidence = request.collisionDirection
    ? 0.9
    : direction === 'unknown'
      ? 0.3
      : 0.7;

  return {
    summary: {
      value: transcript.text,
      source: 'voice',
      confidence: makeConfidence(transcript.confidence),
    },
    sequence: [
      'Customer reported the accident at the roadside',
      `Impact recorded on the ${direction.replace('_', ' ')} of the claimant vehicle`,
      'Vehicles stopped and evidence capture began',
    ],
    collisionDirection: {
      value: direction,
      source: request.collisionDirection ? 'voice' : 'derived',
      confidence: makeConfidence(directionConfidence),
    },
  };
}

/** Assemble the full FNOL from a transcript and the intake request. */
export function structureFnol(transcript: Transcript, request: IntakeRequest): Fnol {
  return {
    structuredFacts: buildStructuredFacts(transcript),
    timeline: buildTimeline(transcript, request),
  };
}
