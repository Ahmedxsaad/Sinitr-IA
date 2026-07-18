/**
 * The seeded relationship graph, loaded from the canonical fixture in
 * `data/graph`. Kept local and deterministic so the fraud-network reveal in the
 * demo never depends on a live external service. The fixture is validated at
 * load so a malformed edit fails fast instead of silently disabling anomaly
 * detection. A real deployment would replace this with a query against the
 * insurer's claims graph.
 */
import { type GraphSeedFixture, graphSeedFixtureSchema } from '@sinistria/contracts';
import seedFixture from '../../../../data/graph/seed.json';

export const SEED_GRAPH: GraphSeedFixture = graphSeedFixtureSchema.parse(seedFixture);
