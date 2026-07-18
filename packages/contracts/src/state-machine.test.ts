import { describe, expect, it } from 'vitest';
import { assertTransition, canTransition } from './state-machine.js';

describe('claim state machine', () => {
  it('allows the happy-path progression', () => {
    expect(canTransition('capturing', 'reconstructing')).toBe(true);
    expect(canTransition('reconstructing', 'verifying')).toBe(true);
    expect(canTransition('verifying', 'recommended')).toBe(true);
    expect(canTransition('recommended', 'decided')).toBe(true);
    expect(canTransition('decided', 'notified')).toBe(true);
  });

  it('allows escalation from any active state', () => {
    expect(canTransition('capturing', 'escalated')).toBe(true);
    expect(canTransition('verifying', 'escalated')).toBe(true);
  });

  it('rejects skipping a state', () => {
    expect(canTransition('capturing', 'recommended')).toBe(false);
  });

  it('treats notified and escalated as terminal', () => {
    expect(canTransition('notified', 'decided')).toBe(false);
    expect(canTransition('escalated', 'recommended')).toBe(false);
  });

  it('throws a descriptive error on an illegal transition', () => {
    expect(() => assertTransition('capturing', 'notified')).toThrow(/Illegal claim transition/);
  });
});
