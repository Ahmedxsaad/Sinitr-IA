/**
 * The claim state machine. Keeping the allowed transitions in one place means
 * every service agrees on what "moving a claim forward" means, and an illegal
 * jump fails loudly instead of corrupting the Twin.
 */
import type { ClaimState } from './enums.js';

/** For each state, the states it is allowed to move to next. */
const ALLOWED_TRANSITIONS: Record<ClaimState, readonly ClaimState[]> = {
  capturing: ['reconstructing', 'escalated'],
  reconstructing: ['verifying', 'escalated'],
  verifying: ['recommended', 'escalated'],
  recommended: ['decided', 'escalated'],
  decided: ['notified'],
  notified: [],
  escalated: [],
};

/** Whether a claim may move directly from `from` to `to`. */
export function canTransition(from: ClaimState, to: ClaimState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Assert a transition is legal, throwing a descriptive error if not. Services
 * call this before changing a claim's state so an invalid move is caught at the
 * boundary rather than silently accepted.
 *
 * @throws Error naming the illegal transition and the states that were allowed.
 */
export function assertTransition(from: ClaimState, to: ClaimState): void {
  if (!canTransition(from, to)) {
    const allowed = ALLOWED_TRANSITIONS[from];
    const allowedText = allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)';
    throw new Error(
      `Illegal claim transition from "${from}" to "${to}". Allowed from "${from}": ${allowedText}.`,
    );
  }
}
