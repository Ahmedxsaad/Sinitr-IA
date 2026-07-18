import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AccidentEvidenceTwin } from '@sinistria/contracts';
import { makeConfidence } from '@sinistria/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { ClaimStore } from './store.js';

/** A minimal, otherwise-empty Twin so each test only overrides what it needs. */
function buildTwin(overrides: Partial<AccidentEvidenceTwin>): AccidentEvidenceTwin {
  return {
    claimId: 'CLM-TEST',
    correlationId: 'corr-test',
    state: 'recommended',
    locale: 'derja',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    structuredFacts: null,
    timeline: null,
    damage: null,
    coverage: null,
    consistency: null,
    completeness: null,
    anomalies: [],
    graphView: null,
    recommendation: null,
    overallConfidence: makeConfidence(0.5),
    audit: [],
    ...overrides,
  };
}

describe('ClaimStore', () => {
  let tempFiles: string[] = [];

  function tempDbPath(): string {
    const dbPath = path.join(os.tmpdir(), `sinistria-store-test-${randomUUID()}.db`);
    tempFiles.push(dbPath);
    return dbPath;
  }

  afterEach(() => {
    for (const file of tempFiles) {
      for (const suffix of ['', '-wal', '-shm']) {
        fs.rmSync(`${file}${suffix}`, { force: true });
      }
    }
    tempFiles = [];
  });

  it('saves and retrieves a claim by id', () => {
    const store = new ClaimStore(tempDbPath());
    store.save({ twin: buildTwin({ claimId: 'CLM-1' }), contactPhone: '+21620000001' });

    const record = store.get('CLM-1');
    expect(record?.twin.claimId).toBe('CLM-1');
    expect(record?.contactPhone).toBe('+21620000001');
    store.close();
  });

  it('returns undefined for a claim that was never saved', () => {
    const store = new ClaimStore(tempDbPath());
    expect(store.get('CLM-MISSING')).toBeUndefined();
    store.close();
  });

  it('lists claims in save order', () => {
    const store = new ClaimStore(tempDbPath());
    store.save({ twin: buildTwin({ claimId: 'CLM-1' }), contactPhone: '+21620000001' });
    store.save({ twin: buildTwin({ claimId: 'CLM-2' }), contactPhone: '+21620000002' });
    store.save({ twin: buildTwin({ claimId: 'CLM-3' }), contactPhone: '+21620000003' });

    expect(store.list().map((record) => record.twin.claimId)).toEqual(['CLM-1', 'CLM-2', 'CLM-3']);
    store.close();
  });

  it('overwrites an existing claim on save instead of duplicating it', () => {
    const store = new ClaimStore(tempDbPath());
    store.save({
      twin: buildTwin({ claimId: 'CLM-1', state: 'recommended' }),
      contactPhone: '+21620000001',
    });
    store.save({
      twin: buildTwin({ claimId: 'CLM-1', state: 'decided' }),
      contactPhone: '+21620000001',
    });

    expect(store.list()).toHaveLength(1);
    expect(store.get('CLM-1')?.twin.state).toBe('decided');
    store.close();
  });

  it('persists claims across a restart (a new store on the same file sees them)', () => {
    const dbPath = tempDbPath();
    const first = new ClaimStore(dbPath);
    first.save({ twin: buildTwin({ claimId: 'CLM-1' }), contactPhone: '+21620000001' });
    first.close();

    const second = new ClaimStore(dbPath);
    expect(second.get('CLM-1')?.twin.claimId).toBe('CLM-1');
    second.close();
  });
});
