/**
 * Apply an adjuster's decision to a prepared claim. Approving is the only action
 * that finalizes the claim and sends the customer notification, because a
 * message follows a human-approved action and nothing else.
 */
import type { AdjusterAction } from '@sinistria/contracts';
import type { ServiceClients } from './clients.js';
import type { ClaimRecord } from './store.js';
import { appendAudit, transition } from './twin.js';

/**
 * @param record - the stored claim, including the contact phone kept out of the Twin.
 * @param action - the adjuster's action.
 * @param note - an optional free-text note from the adjuster.
 * @param clients - used to reach the notify service on approval.
 */
export async function applyDecision(
  record: ClaimRecord,
  action: AdjusterAction,
  note: string | undefined,
  clients: ServiceClients,
): Promise<void> {
  const { twin } = record;

  if (action === 'approve') {
    if (!twin.recommendation) {
      throw new Error('Claim has no prepared recommendation to approve.');
    }
    transition(twin, 'decided');
    appendAudit(twin, 'adjuster', 'decision.approve', note);

    const notification = await clients.notify({
      claimId: twin.claimId,
      correlationId: twin.correlationId,
      route: twin.recommendation.route,
      phone: record.contactPhone,
      message: twin.recommendation.draftCustomerMessage,
    });
    transition(twin, 'notified');
    appendAudit(twin, 'notify', 'notify.sent', notification.messageId);
    return;
  }

  // Clarification or investigation: record the adjuster's action. The claim
  // remains for further human handling; richer states are future work.
  appendAudit(twin, 'adjuster', `decision.${action}`, note);
}
