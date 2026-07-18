/**
 * The safety and eligibility gates. These run before any automation and decide
 * whether a claim may continue on the automated path or must go straight to a
 * human. They are deterministic and explainable by design.
 */
import type { GateResult } from '@sinistria/contracts';

/**
 * Words that indicate a claim is not a simple property-damage-only case and so
 * must leave the automation path. "feu rouge" (a red traffic light) is
 * deliberately excluded so it is not confused with "feu" (fire).
 */
const COMPLEXITY_KEYWORDS: readonly string[] = [
  'incendie',
  'fire',
  'tonneau',
  'rollover',
  'flip',
  'delit de fuite',
  'délit de fuite',
  'hit and run',
  'theft',
  'vol de voiture',
];

/** Safety gate: any reported injury or danger routes the claim to a human. */
export function runSafetyGate(injuryReported: boolean): { passed: boolean; reason?: string } {
  if (injuryReported) {
    return { passed: false, reason: 'Injury or danger was reported, so automation is bypassed.' };
  }
  return { passed: true };
}

/**
 * Eligibility gate: the claim must be property-damage-only with no complexity
 * signals in the narrative.
 */
export function runEligibilityGate(
  injuryReported: boolean,
  narrative: string,
): { passed: boolean; reason?: string } {
  if (injuryReported) {
    return { passed: false, reason: 'Bodily injury is out of scope for the automated path.' };
  }
  const lower = narrative.toLowerCase();
  const hit = COMPLEXITY_KEYWORDS.find((keyword) => lower.includes(keyword));
  if (hit) {
    return { passed: false, reason: `Narrative mentions a complex event ("${hit}").` };
  }
  return { passed: true };
}

/** Run both gates and collect the reasons any of them failed. */
export function runGates(injuryReported: boolean, narrative: string): GateResult {
  const safety = runSafetyGate(injuryReported);
  const eligibility = runEligibilityGate(injuryReported, narrative);
  const reasons: string[] = [];
  if (safety.reason) reasons.push(safety.reason);
  if (eligibility.reason) reasons.push(eligibility.reason);
  return {
    safetyPassed: safety.passed,
    eligibilityPassed: eligibility.passed,
    reasons,
  };
}
