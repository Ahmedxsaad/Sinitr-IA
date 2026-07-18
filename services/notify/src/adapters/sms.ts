/**
 * SMS sending behind a provider-agnostic interface. The mock never touches the
 * network, so the demo works with venue internet down. A real provider adapter
 * would implement the same interface.
 */

export interface SmsResult {
  messageId: string;
  status: 'sent' | 'queued' | 'offline_fallback';
}

export interface SmsAdapter {
  /** Send a message to a destination number. */
  send(phone: string, message: string): Promise<SmsResult>;
}

/**
 * Deterministic mock. It validates the destination and body like a real
 * provider would, then reports success without any network call.
 */
export class MockSmsAdapter implements SmsAdapter {
  async send(phone: string, message: string): Promise<SmsResult> {
    if (phone.trim().length === 0) {
      throw new Error('Cannot send an SMS without a destination number.');
    }
    if (message.trim().length === 0) {
      throw new Error('Cannot send an empty SMS.');
    }
    // A stable id derived from the last digits of the number keeps the demo
    // reproducible while still looking like a provider message id.
    const suffix = phone.replace(/\D/g, '').slice(-4) || '0000';
    return { messageId: `mock-sms-${suffix}`, status: 'sent' };
  }
}
