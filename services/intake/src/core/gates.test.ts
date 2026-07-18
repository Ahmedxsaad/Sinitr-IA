import { describe, expect, it } from 'vitest';
import { runEligibilityGate, runGates, runSafetyGate } from './gates.js';

describe('runSafetyGate', () => {
  it('passes when no injury is reported', () => {
    expect(runSafetyGate(false)).toEqual({ passed: true });
  });

  it('fails and gives a reason when an injury is reported', () => {
    const result = runSafetyGate(true);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/injury/i);
  });
});

describe('runEligibilityGate', () => {
  it('passes a plain property-damage narrative', () => {
    expect(runEligibilityGate(false, 'Karhba darbitni fel porte arriere gauche.')).toEqual({
      passed: true,
    });
  });

  it('fails when injury is reported, regardless of narrative content', () => {
    const result = runEligibilityGate(true, 'Just a scratch on the bumper.');
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/bodily injury/i);
  });

  it('fails on the French phrase for catching fire', () => {
    const result = runEligibilityGate(false, "La voiture a pris feu apres l'accident.");
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('pris feu');
  });

  it('fails on an English fire keyword', () => {
    const result = runEligibilityGate(false, 'The engine caught fire after the crash.');
    expect(result.passed).toBe(false);
  });

  it('does not confuse "feu rouge" (red light) with a fire complexity signal', () => {
    // This is the documented false-positive the keyword list is designed to avoid:
    // stopping at a red light must not trip the same detector as a car fire.
    expect(runEligibilityGate(false, 'Kont wa9ef fel feu rouge.')).toEqual({ passed: true });
  });

  it('does not treat fire as a substring inside an unrelated word', () => {
    expect(runEligibilityGate(false, 'The firewall camera recorded the impact.')).toEqual({
      passed: true,
    });
  });

  it('fails on a rollover keyword', () => {
    const result = runEligibilityGate(false, 'The car did a tonneau after the impact.');
    expect(result.passed).toBe(false);
  });

  it('fails on a hit and run keyword', () => {
    const result = runEligibilityGate(false, "C'etait un delit de fuite, il est parti vite.");
    expect(result.passed).toBe(false);
  });

  it('fails on a theft keyword', () => {
    const result = runEligibilityGate(false, 'It looked like a vol de voiture.');
    expect(result.passed).toBe(false);
  });

  it('is case-insensitive when matching complexity keywords', () => {
    const result = runEligibilityGate(false, 'INCENDIE dans le moteur.');
    expect(result.passed).toBe(false);
  });
});

describe('runGates', () => {
  it('passes both gates for a clean, non-injury narrative', () => {
    const result = runGates(false, 'Impact leger a l arriere gauche, pas de blesses.');
    expect(result.safetyPassed).toBe(true);
    expect(result.eligibilityPassed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('collects one reason when only the safety gate fails via injury', () => {
    const result = runGates(true, 'Clean narrative otherwise.');
    expect(result.safetyPassed).toBe(false);
    expect(result.eligibilityPassed).toBe(false);
    // Injury reported fails both gates, so both reasons are collected.
    expect(result.reasons).toHaveLength(2);
  });

  it('fails only eligibility when the narrative has a complexity keyword but no injury', () => {
    const result = runGates(false, 'Vol de voiture reported by witness.');
    expect(result.safetyPassed).toBe(true);
    expect(result.eligibilityPassed).toBe(false);
    expect(result.reasons).toHaveLength(1);
  });
});
