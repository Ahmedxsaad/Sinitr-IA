/**
 * Extracts structured facts (collision direction, location, plate) from free
 * narrative text, behind a provider-agnostic interface, mirroring the speech
 * adapter's seam so a real language model can be dropped in without touching
 * intake's core. The mock keeps the deterministic regex/keyword matching
 * intake always used, so the demo path never depends on a live network call.
 */
import { getConfig } from '@sinistria/config';
import { type ImpactArea, impactAreaSchema } from '@sinistria/contracts';

export interface ExtractedNarrative {
  collisionDirection: ImpactArea;
  location: string | null;
  plate: string | null;
  /** 0 to 1. How confident the extractor is in the collision direction. */
  confidence: number;
}

export interface NarrativeExtractor {
  extract(text: string, locale: string): Promise<ExtractedNarrative>;
}

/** Ordered so more specific phrases (rear left) win over general ones (rear). */
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

/** Deterministic mock: the same regex/keyword matching intake always used. */
export class MockNarrativeExtractor implements NarrativeExtractor {
  async extract(text: string, _locale: string): Promise<ExtractedNarrative> {
    const collisionDirection = detectCollisionDirection(text);
    return {
      collisionDirection,
      location: detectLocation(text),
      plate: detectPlate(text),
      confidence: collisionDirection === 'unknown' ? 0.3 : 0.7,
    };
  }
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

interface ExtractedNarrativeJson {
  collisionDirection?: string;
  location?: string | null;
  plate?: string | null;
  confidence?: number;
}

function buildPrompt(text: string, locale: string): string {
  return [
    'You are extracting structured facts from a motor accident narrative for an',
    'insurance intake system. The narrative may mix Tunisian Derja, French, and',
    `Arabic; the customer's locale hint is "${locale}" (derja, ar, or fr).`,
    '',
    'Return the collision direction as exactly one of: front, front_left,',
    'front_right, rear, rear_left, rear_right, left, right, unknown.',
    'Return a short location phrase if one is mentioned, or null.',
    'Return a vehicle plate if one is mentioned, or null.',
    'Return your own confidence in the collision direction, from 0 to 1.',
    '',
    'Narrative:',
    text,
  ].join('\n');
}

/**
 * Real Gemini-backed extraction, using structured JSON output so the model's
 * collision direction can only be one of the contract's own enum values.
 * Throws on any API or shape failure: intake's route boundary turns that into
 * a neutral error rather than silently trusting malformed model output.
 */
export class GeminiNarrativeExtractor implements NarrativeExtractor {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async extract(text: string, locale: string): Promise<ExtractedNarrative> {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(text, locale) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                collisionDirection: { type: 'STRING', enum: impactAreaSchema.options },
                location: { type: 'STRING', nullable: true },
                plate: { type: 'STRING', nullable: true },
                confidence: { type: 'NUMBER' },
              },
              required: ['collisionDirection', 'confidence'],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini narrative extraction failed: ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as GeminiResponse;
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      throw new Error('Gemini narrative extraction returned no content');
    }

    const parsed = JSON.parse(raw) as ExtractedNarrativeJson;
    const direction = impactAreaSchema.safeParse(parsed.collisionDirection);

    return {
      collisionDirection: direction.success ? direction.data : 'unknown',
      location: parsed.location ?? null,
      plate: parsed.plate ?? null,
      confidence:
        typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
  }
}

/** Selects the mock or the real Gemini extractor from the shared config. */
export function createNarrativeExtractor(): NarrativeExtractor {
  const config = getConfig();
  if (config.DEMO_MODE) return new MockNarrativeExtractor();
  if (!config.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when DEMO_MODE is false');
  }
  return new GeminiNarrativeExtractor(config.GEMINI_API_KEY, config.GEMINI_MODEL);
}
