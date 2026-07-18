/**
 * Intake's single entry point. Wiring the transcription, FNOL structuring, and
 * gates together here means the Fastify route and the in-process pipeline test
 * exercise exactly the same logic.
 */
import { type IntakeRequest, type IntakeResult, makeConfidence } from '@sinistria/contracts';
import { createNarrativeExtractor, type NarrativeExtractor } from '../adapters/extractor.js';
import { MockSpeechAdapter, type SpeechAdapter } from '../adapters/speech.js';
import { structureFnol } from './fnol.js';
import { runGates } from './gates.js';

/** The default demo-mode speech adapter. Swap for a real provider later. */
const defaultSpeech: SpeechAdapter = new MockSpeechAdapter();

/**
 * Process an intake request into a structured result.
 *
 * @param request - a validated intake request.
 * @param speech - the speech adapter to use (defaults to the mock).
 * @param extractor - the narrative extractor to use (defaults to the mock in
 *   demo mode, or the real Gemini adapter when DEMO_MODE is off).
 */
export async function processIntake(
  request: IntakeRequest,
  speech: SpeechAdapter = defaultSpeech,
  extractor: NarrativeExtractor = createNarrativeExtractor(),
): Promise<IntakeResult> {
  const transcript = await speech.transcribe(request.narrative, request.locale);
  const fnol = await structureFnol(transcript, request, extractor);
  const gates = runGates(request.injuryReported, request.narrative);

  return {
    transcript: {
      value: transcript.text,
      source: 'voice',
      confidence: makeConfidence(transcript.confidence),
    },
    fnol,
    gates,
  };
}
