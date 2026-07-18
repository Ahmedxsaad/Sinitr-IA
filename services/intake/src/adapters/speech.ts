/**
 * Speech-to-text behind a provider-agnostic interface. Business logic depends on
 * this interface, never on a specific vendor, so a real hosted provider can be
 * dropped in later without touching intake's core.
 */

export interface Transcript {
  text: string;
  /** Model confidence from 0 to 1. Low values must stay visible downstream. */
  confidence: number;
}

export interface SpeechAdapter {
  /**
   * Transcribe an utterance in the given locale.
   *
   * @param utterance - the raw input. In demo mode this is the customer's typed
   *   narrative standing in for a voice note.
   * @param locale - the language hint (derja, ar, or fr).
   */
  transcribe(utterance: string, locale: string): Promise<Transcript>;
}

/**
 * Deterministic mock: it treats the supplied text as the transcript and reports
 * high confidence for non-empty input. This keeps the demo fully offline and
 * reproducible while the real speech provider is not yet wired.
 */
export class MockSpeechAdapter implements SpeechAdapter {
  async transcribe(utterance: string, _locale: string): Promise<Transcript> {
    const text = utterance.trim();
    // An empty utterance is a real failure mode, so it must lower confidence
    // rather than silently pass as perfect.
    return { text, confidence: text.length > 0 ? 0.94 : 0.2 };
  }
}
