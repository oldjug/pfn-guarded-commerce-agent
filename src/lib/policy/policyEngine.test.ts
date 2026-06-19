import { describe, expect, it } from "vitest";

import {
  DEMO_SCENARIOS,
  GUARDED_COMMERCE_POLICY,
} from "./scenarios";
import { evaluateCommerceRequest } from "./policyEngine";

function evaluateScenario(id: string) {
  const scenario = DEMO_SCENARIOS.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }

  return evaluateCommerceRequest(GUARDED_COMMERCE_POLICY, scenario.request);
}

describe("evaluateCommerceRequest", () => {
  it("approves a compliant HBAR service request", () => {
    const evaluation = evaluateScenario("approved-feature-buy");

    expect(evaluation.decision).toBe("approved");
    expect(evaluation.checks).toHaveLength(6);
    expect(evaluation.checks.every(({ passed }) => passed)).toBe(true);
    expect(evaluation.escalatedBy).toEqual([]);
  });

  it("blocks a request above the per-request limit", () => {
    const evaluation = evaluateScenario("blocked-over-limit");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toContain("max_spend");
  });

  it("blocks an unknown recipient", () => {
    const evaluation = evaluateScenario("blocked-unknown-recipient");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["allowed_counterparty"]);
  });

  it("blocks an unapproved purpose", () => {
    const evaluation = evaluateScenario("blocked-wrong-purpose");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["allowed_purpose"]);
  });

  it("blocks a wrong currency without cascading into spend policies", () => {
    const evaluation = evaluateScenario("blocked-wrong-currency");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.request.currency).toBe("XRP");
    expect(evaluation.blockedBy).toEqual(["currency"]);
  });

  it("escalates a higher-value HBAR request for owner review", () => {
    const evaluation = evaluateScenario("escalated-owner-review");

    expect(evaluation.decision).toBe("escalated");
    expect(evaluation.blockedBy).toEqual([]);
    expect(evaluation.escalatedBy).toEqual(["human_approval"]);
  });

  it("blocks a request that would exceed the daily budget", () => {
    const request = {
      ...DEMO_SCENARIOS[0].request,
      requestId: "GCA-BUDGET-007",
      amountAtomic: "200000000",
      spentTodayAtomic: "2900000000",
    };
    const evaluation = evaluateCommerceRequest(
      GUARDED_COMMERCE_POLICY,
      request,
    );

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["daily_budget"]);
  });
});
