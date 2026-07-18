/**
 * Turn a transcript and the customer's guided answers into structured first
 * notice of loss fields: the actors and vehicles, the timeline, and the
 * collision direction. The collision direction, location, and plate come from
 * a `NarrativeExtractor` (mock or real), kept behind that seam so this module
 * stays a pure, easy-to-test assembly step.
 */
import {
  type EventTimeline,
  type Fnol,
  type IntakeRequest,
  type StructuredFacts,
  makeConfidence,
} from '@sinistria/contracts';
import type { ExtractedNarrative, NarrativeExtractor } from '../adapters/extractor.js';
import type { Transcript } from '../adapters/speech.js';

/**
 * Build the structured facts. The collision direction from the customer's guided
 * answer takes priority over what the extractor infers from the narrative.
 */
function buildStructuredFacts(
  transcript: Transcript,
  extracted: ExtractedNarrative,
): StructuredFacts {
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
      value: extracted.location ?? 'Unknown',
      source: 'derived',
      confidence: makeConfidence(extracted.location ? 0.7 : 0.3),
    },
    vehicles: [
      {
        plate: extracted.plate ?? 'UNKNOWN',
        isClaimant: true,
      },
    ],
  };
}

/** Build the event timeline, preferring the guided answer for collision direction. */
function buildTimeline(
  transcript: Transcript,
  request: IntakeRequest,
  extracted: ExtractedNarrative,
): EventTimeline {
  const direction = request.collisionDirection ?? extracted.collisionDirection;
  const directionConfidence = request.collisionDirection
    ? 0.9
    : direction === 'unknown'
      ? 0.3
      : extracted.confidence;

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

/** Assemble the full FNOL from a transcript, the intake request, and the extractor. */
export async function structureFnol(
  transcript: Transcript,
  request: IntakeRequest,
  extractor: NarrativeExtractor,
): Promise<Fnol> {
  const extracted = await extractor.extract(transcript.text, request.locale);
  return {
    structuredFacts: buildStructuredFacts(transcript, extracted),
    timeline: buildTimeline(transcript, request, extracted),
  };
}
