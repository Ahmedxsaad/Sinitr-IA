import type { ClaimRoute } from '@sinistria/contracts';

/**
 * A colored pill for a claim's route. Sharing this one component keeps
 * fast-track, review, and investigate colored consistently everywhere a route
 * is shown, so an investigate route can never accidentally render in the same
 * green as a fast-track one.
 */
export function RouteBadge({ route }: { route: ClaimRoute }) {
  return <span className={`badge badge-route-${route}`}>{route.replace('_', ' ')}</span>;
}
