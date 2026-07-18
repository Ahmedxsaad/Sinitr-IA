import { describe, expect, it } from 'vitest';
import { MockSmsAdapter } from './sms.js';

describe('MockSmsAdapter', () => {
  const adapter = new MockSmsAdapter();

  it('sends successfully and returns a stable message id derived from the phone', async () => {
    const result = await adapter.send('+21620000001', 'Your claim was prepared.');
    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('mock-sms-0001');
  });

  it('produces the same message id for the same destination (deterministic for the demo)', async () => {
    const first = await adapter.send('+21620000055', 'message one');
    const second = await adapter.send('+21620000055', 'message two');
    expect(first.messageId).toBe(second.messageId);
  });

  it('uses whatever digits are available when the phone has fewer than 4', async () => {
    const result = await adapter.send('+2', 'short number');
    expect(result.messageId).toBe('mock-sms-2');
  });

  it('falls back to a placeholder suffix when the phone has no digits at all', async () => {
    const result = await adapter.send('unknown-caller', 'no digits here');
    expect(result.messageId).toBe('mock-sms-0000');
  });

  it('rejects sending to an empty destination', async () => {
    await expect(adapter.send('', 'Hello')).rejects.toThrow(/destination number/);
  });

  it('rejects sending to a whitespace-only destination', async () => {
    await expect(adapter.send('   ', 'Hello')).rejects.toThrow(/destination number/);
  });

  it('rejects an empty message body', async () => {
    await expect(adapter.send('+21620000001', '')).rejects.toThrow(/empty SMS/);
  });

  it('rejects a whitespace-only message body', async () => {
    await expect(adapter.send('+21620000001', '   ')).rejects.toThrow(/empty SMS/);
  });
});
