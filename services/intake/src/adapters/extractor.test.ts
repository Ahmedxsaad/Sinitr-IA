import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectCollisionDirection,
  detectLocation,
  detectPlate,
  GeminiNarrativeExtractor,
  MockNarrativeExtractor,
} from './extractor.js';

describe('detectCollisionDirection', () => {
  it('detects rear left from French', () => {
    expect(detectCollisionDirection('Choc a arriere gauche de la voiture')).toBe('rear_left');
  });

  it('detects rear left from Derja', () => {
    expect(detectCollisionDirection('darbitni men wara yasar')).toBe('rear_left');
  });

  it('detects front right from English', () => {
    expect(detectCollisionDirection('Impact on the front right corner')).toBe('front_right');
  });

  it('prefers the more specific rear_left over the general rear', () => {
    expect(detectCollisionDirection('rear left damage visible, rear bumper too')).toBe('rear_left');
  });

  it('falls back to the general rear when no side is mentioned', () => {
    expect(detectCollisionDirection('The rear of the car was hit')).toBe('rear');
  });

  it('falls back to a bare side when no axis is mentioned', () => {
    expect(detectCollisionDirection('damage on the left side somewhere')).toBe('left');
  });

  it('returns unknown when nothing matches', () => {
    expect(detectCollisionDirection('The car made a strange noise')).toBe('unknown');
  });
});

describe('detectPlate', () => {
  it('detects a standard Tunisian plate format', () => {
    expect(detectPlate('Plaque 125 TUN 4587 immatriculee')).toBe('125 TUN 4587');
  });

  it('is case-insensitive and normalizes to uppercase', () => {
    expect(detectPlate('plaque 200 tun 3020')).toBe('200 TUN 3020');
  });

  it('returns null when no plate pattern is present', () => {
    expect(detectPlate('Karhba jet men wara w darbitni')).toBeNull();
  });
});

describe('detectLocation', () => {
  it('detects a red light location', () => {
    expect(detectLocation('Kont wa9ef fel feu rouge, karhba jet men wara')).toMatch(/feu rouge/i);
  });

  it('detects a roundabout location', () => {
    expect(detectLocation("L'accident sar fel rond point, karhba darbitni")).toMatch(/rond.point/i);
  });

  it('detects a highway location', () => {
    expect(detectLocation('accident sur autoroute A1 vers midi')).toMatch(/autoroute/i);
  });

  it('returns null when no known location phrase is present', () => {
    expect(detectLocation('Kont wa9ef w karhba darbitni fel arriere')).toBeNull();
  });
});

describe('MockNarrativeExtractor', () => {
  it('reflects the same regex detection as its standalone functions', async () => {
    const extractor = new MockNarrativeExtractor();
    const result = await extractor.extract(
      'Choc a arriere gauche, plaque 125 TUN 4587, fel feu rouge',
      'fr',
    );
    expect(result.collisionDirection).toBe('rear_left');
    expect(result.plate).toBe('125 TUN 4587');
    expect(result.location).toMatch(/feu rouge/i);
    expect(result.confidence).toBe(0.7);
  });

  it('reports low confidence when nothing is detectable', async () => {
    const extractor = new MockNarrativeExtractor();
    const result = await extractor.extract('Something happened today.', 'fr');
    expect(result.collisionDirection).toBe('unknown');
    expect(result.confidence).toBe(0.3);
  });
});

describe('GeminiNarrativeExtractor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(response: unknown, ok = true, status = 200) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: async () => response,
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  function geminiBody(json: unknown) {
    return { candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] };
  }

  it('sends the narrative and locale in the request and parses a valid response', async () => {
    const fetchMock = stubFetch(
      geminiBody({
        collisionDirection: 'rear_left',
        location: 'feu rouge',
        plate: '125 TUN 4587',
        confidence: 0.82,
      }),
    );
    const extractor = new GeminiNarrativeExtractor('test-key', 'gemini-2.5-flash');

    const result = await extractor.extract('darbitni men wara yasar fel feu rouge', 'derja');

    expect(result).toEqual({
      collisionDirection: 'rear_left',
      location: 'feu rouge',
      plate: '125 TUN 4587',
      confidence: 0.82,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('gemini-2.5-flash:generateContent?key=test-key');
    const body = JSON.parse(init.body as string) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(body.contents[0]?.parts[0]?.text).toContain('darbitni men wara yasar fel feu rouge');
    expect(body.contents[0]?.parts[0]?.text).toContain('derja');
  });

  it('falls back to unknown when the model returns an invalid direction', async () => {
    stubFetch(geminiBody({ collisionDirection: 'sideways', confidence: 0.4 }));
    const extractor = new GeminiNarrativeExtractor('test-key', 'gemini-2.5-flash');

    const result = await extractor.extract('some narrative', 'fr');
    expect(result.collisionDirection).toBe('unknown');
  });

  it('clamps an out-of-range confidence into 0 to 1', async () => {
    stubFetch(geminiBody({ collisionDirection: 'front', confidence: 4.2 }));
    const extractor = new GeminiNarrativeExtractor('test-key', 'gemini-2.5-flash');

    const result = await extractor.extract('some narrative', 'fr');
    expect(result.confidence).toBe(1);
  });

  it('throws a clear error when the API responds with a non-ok status', async () => {
    stubFetch({}, false, 429);
    const extractor = new GeminiNarrativeExtractor('test-key', 'gemini-2.5-flash');

    await expect(extractor.extract('some narrative', 'fr')).rejects.toThrow(/429/);
  });

  it('throws a clear error when the response has no content', async () => {
    stubFetch({ candidates: [] });
    const extractor = new GeminiNarrativeExtractor('test-key', 'gemini-2.5-flash');

    await expect(extractor.extract('some narrative', 'fr')).rejects.toThrow(/no content/);
  });
});
