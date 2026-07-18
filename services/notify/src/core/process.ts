/**
 * Notify's single entry point. It only sends what it is given; it never decides
 * to notify on its own, because a message follows a human-approved action.
 */
import type { NotifyRequest, NotifyResult } from '@sinistria/contracts';
import { MockSmsAdapter, type SmsAdapter } from '../adapters/sms.js';

const defaultSms: SmsAdapter = new MockSmsAdapter();

/**
 * Send the customer notification for a claim.
 *
 * @param request - a validated notify request.
 * @param sms - the SMS adapter (defaults to the mock).
 */
export async function processNotify(
  request: NotifyRequest,
  sms: SmsAdapter = defaultSms,
): Promise<NotifyResult> {
  const result = await sms.send(request.phone, request.message);
  return {
    status: result.status,
    channel: 'sms',
    messageId: result.messageId,
    sentAt: new Date().toISOString(),
  };
}
