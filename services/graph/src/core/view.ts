/**
 * Builds the relationship-graph view the cockpit reveals for a claim: the
 * claim itself plus whatever it shares with an earlier claim. Kept as a pure
 * function of the already-detected anomalies so the view can never disagree
 * with the anomaly flags it explains. Neutral language only, and node types
 * are limited to what the seeded graph actually backs (see D-0015): no
 * "garage" or "vehicle" node yet, because the seed data has no such entity.
 */
import type {
  AnomalyFlag,
  GraphEdge,
  GraphNode,
  GraphRequest,
  GraphView,
} from '@sinistria/contracts';

/** Build the graph view for a claim from the anomalies already detected against it. */
export function buildGraphView(request: GraphRequest, anomalies: AnomalyFlag[]): GraphView {
  if (anomalies.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const focusId = `claim:${request.claimId}`;
  nodes.set(focusId, { id: focusId, type: 'claim', label: request.claimId, isFocus: true });

  for (const anomaly of anomalies) {
    if (!anomaly.relatedClaimId) continue;
    const priorId = `claim:${anomaly.relatedClaimId}`;
    nodes.set(priorId, {
      id: priorId,
      type: 'claim',
      label: anomaly.relatedClaimId,
      isFocus: false,
    });

    if (anomaly.type === 'shared_garage_phone' && request.garagePhone) {
      const phoneId = `phone:${request.garagePhone}`;
      nodes.set(phoneId, {
        id: phoneId,
        type: 'phone',
        label: request.garagePhone,
        isFocus: false,
      });
      edges.push({ source: focusId, target: phoneId, relation: 'used this garage phone' });
      edges.push({ source: phoneId, target: priorId, relation: 'also used by this claim' });
    } else if (anomaly.type === 'reused_image') {
      edges.push({
        source: focusId,
        target: priorId,
        relation: 'shares a photo with this claim',
      });
    } else {
      // Any other anomaly type still connects the two claims directly, using
      // its own neutral description, so a future anomaly kind never produces
      // an orphan node in the view.
      edges.push({ source: focusId, target: priorId, relation: anomaly.description });
    }
  }

  return { nodes: [...nodes.values()], edges };
}
