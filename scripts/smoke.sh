#!/usr/bin/env bash
#
# Live smoke test. Starts every backend service as its own process, then drives
# one honest claim through the gateway over HTTP: submit, verify the fast-track
# recommendation, approve, and verify the customer notification. Tears the
# services down on exit. Run from anywhere: scripts/smoke.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SERVICES=(intake evidence graph claims notify gateway)
PORTS=(4001 4002 4003 4004 4005 4000)
pids=()

cleanup() {
  echo "Stopping services..."
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT

echo "Starting services..."
for service in "${SERVICES[@]}"; do
  pnpm --filter "@sinistria/${service}" start >"/tmp/sinistria-${service}.log" 2>&1 &
  pids+=("$!")
done

# Wait for every service to answer its health endpoint.
for port in "${PORTS[@]}"; do
  ready=false
  for _ in $(seq 1 60); do
    if curl -sf "http://localhost:${port}/health" >/dev/null 2>&1; then ready=true; break; fi
    sleep 0.5
  done
  if [ "$ready" != true ]; then
    echo "Service on port ${port} did not become healthy in time." >&2
    exit 1
  fi
done
echo "All services healthy."

echo "Submitting the honest claim..."
created=$(curl -sf -X POST http://localhost:4000/api/claims \
  -H 'content-type: application/json' --data @data/claims/honest.json)

claim_id=$(printf '%s' "$created" | python3 -c 'import json,sys; print(json.load(sys.stdin)["claimId"])')

# Assert the honest claim was prepared as a fast-track recommendation.
printf '%s' "$created" | python3 -c '
import json, sys
twin = json.load(sys.stdin)
route = (twin.get("recommendation") or {}).get("route")
assert twin["state"] == "recommended", "unexpected state " + twin["state"]
assert route == "fast_track", "unexpected route " + str(route)
assert twin["completeness"]["score"] == 100, "completeness should be 100"
print("  route=" + route + " completeness=" + str(twin["completeness"]["score"]) + "% confidence=" + twin["overallConfidence"]["label"])
'

echo "Approving claim ${claim_id}..."
decided=$(curl -sf -X POST "http://localhost:4000/api/claims/${claim_id}/decision" \
  -H 'content-type: application/json' --data '{"action":"approve"}')

printf '%s' "$decided" | python3 -c '
import json, sys
twin = json.load(sys.stdin)
assert twin["state"] == "notified", "unexpected state " + twin["state"]
assert any(e["action"] == "notify.sent" for e in twin["audit"]), "no notification recorded"
print("  state=notified, customer notification sent")
'

echo "Smoke test passed."
