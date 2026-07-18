import { describe, expect, it } from 'vitest';
import { detectCollisionDirection, detectLocation, detectPlate, structureFnol } from './fnol.js';
import type { Transcript } from '../adapters/speech.js';
import type { IntakeRequest } from '@sinistria/contracts';

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

describe('structureFnol', () => {
  const transcript: Transcript = {
    text: 'Kont wa9ef fel feu rouge, karhba jet men wara w darbitni fel porte arriere gauche. Plaque 125 TUN 4587.',
    confidence: 0.94,
  };

  it('gives voice-sourced high confidence to a customer-confirmed collision direction', () => {
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'derja',
      narrative: transcript.text,
      injuryReported: false,
      collisionDirection: 'rear_left',
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = structureFnol(transcript, request);
    expect(fnol.timeline.collisionDirection.value).toBe('rear_left');
    expect(fnol.timeline.collisionDirection.source).toBe('voice');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('high');
  });

  it('derives the collision direction from the narrative when the customer did not pick one', () => {
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'derja',
      narrative: transcript.text,
      injuryReported: false,
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = structureFnol(transcript, request);
    expect(fnol.timeline.collisionDirection.value).toBe('rear_left');
    expect(fnol.timeline.collisionDirection.source).toBe('derived');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('medium');
  });

  it('extracts the plate and location into structured facts', () => {
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'derja',
      narrative: transcript.text,
      injuryReported: false,
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = structureFnol(transcript, request);
    expect(fnol.structuredFacts.vehicles[0]?.plate).toBe('125 TUN 4587');
    expect(fnol.structuredFacts.location.value).toMatch(/feu rouge/i);
  });

  it('falls back to Unknown location and UNKNOWN plate when nothing is detectable', () => {
    const plainTranscript: Transcript = {
      text: 'Something happened to my car today.',
      confidence: 0.8,
    };
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'fr',
      narrative: plainTranscript.text,
      injuryReported: false,
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = structureFnol(plainTranscript, request);
    expect(fnol.structuredFacts.location.value).toBe('Unknown');
    expect(fnol.structuredFacts.vehicles[0]?.plate).toBe('UNKNOWN');
    expect(fnol.timeline.collisionDirection.value).toBe('unknown');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('low');
  });
});
