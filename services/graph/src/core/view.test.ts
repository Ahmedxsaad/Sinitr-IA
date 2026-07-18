import { describe, expect, it } from 'vitest';
import type { AnomalyFlag, GraphRequest } from '@sinistria/contracts';
import { buildGraphView } from './view.js';

const baseRequest: GraphRequest = {
  claimId: 'CLM-TEST',
  correlationId: 'corr-test',
  claimantPhone: '+21620000000',
  mediaRefs: [],
};

describe('buildGraphView', () => {
  it('returns an empty view when there are no anomalies', () => {
    const view = buildGraphView(baseRequest, []);
    expect(view).toEqual({ nodes: [], edges: [] });
  });

  it('builds a claim, phone, and prior-claim chain for a shared garage phone', () => {
    const anomalies: AnomalyFlag[] = [
      {
        type: 'shared_garage_phone',
        description: 'The garage phone number also appears in an earlier claim.',
        severity: 'high',
        relatedClaimId: 'CLM-PRIOR',
      },
    ];
    const view = buildGraphView({ ...baseRequest, garagePhone: '+21620000009' }, anomalies);

    expect(view.nodes).toHaveLength(3);
    expect(view.nodes).toContainEqual({
      id: 'claim:CLM-TEST',
      type: 'claim',
      label: 'CLM-TEST',
      isFocus: true,
    });
    expect(view.nodes).toContainEqual({
      id: 'phone:+21620000009',
      type: 'phone',
      label: '+21620000009',
      isFocus: false,
    });
    expect(view.nodes).toContainEqual({
      id: 'claim:CLM-PRIOR',
      type: 'claim',
      label: 'CLM-PRIOR',
      isFocus: false,
    });
    expect(view.edges).toEqual([
      { source: 'claim:CLM-TEST', target: 'phone:+21620000009', relation: expect.any(String) },
      { source: 'phone:+21620000009', target: 'claim:CLM-PRIOR', relation: expect.any(String) },
    ]);
  });

  it('connects the two claims directly for a reused image', () => {
    const anomalies: AnomalyFlag[] = [
      {
        type: 'reused_image',
        description: 'An uploaded image matches one submitted in an earlier claim.',
        severity: 'high',
        relatedClaimId: 'CLM-PRIOR',
      },
    ];
    const view = buildGraphView(baseRequest, anomalies);

    expect(view.nodes).toHaveLength(2);
    expect(view.edges).toEqual([
      { source: 'claim:CLM-TEST', target: 'claim:CLM-PRIOR', relation: expect.any(String) },
    ]);
  });

  it('deduplicates the prior claim node when two anomalies point at the same claim', () => {
    const anomalies: AnomalyFlag[] = [
      {
        type: 'shared_garage_phone',
        description: 'The garage phone number also appears in an earlier claim.',
        severity: 'high',
        relatedClaimId: 'CLM-PRIOR',
      },
      {
        type: 'reused_image',
        description: 'An uploaded image matches one submitted in an earlier claim.',
        severity: 'high',
        relatedClaimId: 'CLM-PRIOR',
      },
    ];
    const view = buildGraphView({ ...baseRequest, garagePhone: '+21620000009' }, anomalies);

    const priorClaimNodes = view.nodes.filter((node) => node.id === 'claim:CLM-PRIOR');
    expect(priorClaimNodes).toHaveLength(1);
    expect(view.nodes).toHaveLength(3); // focus claim, phone, prior claim
    expect(view.edges).toHaveLength(3); // focus->phone, phone->prior, focus->prior (image)
  });

  it('falls back to a direct edge using the anomaly description for an unhandled anomaly type', () => {
    const anomalies: AnomalyFlag[] = [
      {
        type: 'invoice_mismatch',
        description: 'Invoice category does not match the visible damage.',
        severity: 'medium',
        relatedClaimId: 'CLM-PRIOR',
      },
    ];
    const view = buildGraphView(baseRequest, anomalies);

    expect(view.edges).toEqual([
      {
        source: 'claim:CLM-TEST',
        target: 'claim:CLM-PRIOR',
        relation: 'Invoice category does not match the visible damage.',
      },
    ]);
  });

  it('skips an anomaly with no related claim id rather than creating an orphan node', () => {
    const anomalies: AnomalyFlag[] = [
      {
        type: 'reused_image',
        description: 'An uploaded image matches one submitted in an earlier claim.',
        severity: 'high',
      },
    ];
    const view = buildGraphView(baseRequest, anomalies);

    expect(view.nodes).toHaveLength(1); // only the focus claim
    expect(view.edges).toHaveLength(0);
  });
});
