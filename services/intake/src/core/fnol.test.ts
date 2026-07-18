import { describe, expect, it } from 'vitest';
import { MockNarrativeExtractor } from '../adapters/extractor.js';
import type { Transcript } from '../adapters/speech.js';
import { structureFnol } from './fnol.js';
import type { IntakeRequest } from '@sinistria/contracts';

describe('structureFnol', () => {
  const extractor = new MockNarrativeExtractor();
  const transcript: Transcript = {
    text: 'Kont wa9ef fel feu rouge, karhba jet men wara w darbitni fel porte arriere gauche. Plaque 125 TUN 4587.',
    confidence: 0.94,
  };

  it('gives voice-sourced high confidence to a customer-confirmed collision direction', async () => {
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
    const fnol = await structureFnol(transcript, request, extractor);
    expect(fnol.timeline.collisionDirection.value).toBe('rear_left');
    expect(fnol.timeline.collisionDirection.source).toBe('voice');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('high');
  });

  it('derives the collision direction from the narrative when the customer did not pick one', async () => {
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'derja',
      narrative: transcript.text,
      injuryReported: false,
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = await structureFnol(transcript, request, extractor);
    expect(fnol.timeline.collisionDirection.value).toBe('rear_left');
    expect(fnol.timeline.collisionDirection.source).toBe('derived');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('medium');
  });

  it('extracts the plate and location into structured facts', async () => {
    const request: IntakeRequest = {
      claimId: 'CLM-TEST',
      correlationId: 'corr-test',
      locale: 'derja',
      narrative: transcript.text,
      injuryReported: false,
      confirmed: true,
      mediaRefs: [],
    };
    const fnol = await structureFnol(transcript, request, extractor);
    expect(fnol.structuredFacts.vehicles[0]?.plate).toBe('125 TUN 4587');
    expect(fnol.structuredFacts.location.value).toMatch(/feu rouge/i);
  });

  it('falls back to Unknown location and UNKNOWN plate when nothing is detectable', async () => {
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
    const fnol = await structureFnol(plainTranscript, request, extractor);
    expect(fnol.structuredFacts.location.value).toBe('Unknown');
    expect(fnol.structuredFacts.vehicles[0]?.plate).toBe('UNKNOWN');
    expect(fnol.timeline.collisionDirection.value).toBe('unknown');
    expect(fnol.timeline.collisionDirection.confidence.label).toBe('low');
  });
});
