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
    const evaluation = evaluateScenario("approved-hbar");

    expect(evaluation.decision).toBe("approved");
    expect(evaluation.checks).toHaveLength(5);
    expect(evaluation.checks.every(({ passed }) => passed)).toBe(true);
  });

  it("blocks a request above the per-request limit", () => {
    const evaluation = evaluateScenario("over-limit");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toContain("max_spend");
  });

  it("blocks an unknown recipient", () => {
    const evaluation = evaluateScenario("unknown-recipient");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["allowed_counterparty"]);
  });

  it("blocks an unapproved purpose", () => {
    const evaluation = evaluateScenario("wrong-purpose");

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["allowed_purpose"]);
  });

  it("evaluates USDC at the policy layer without implying execution", () => {
    const evaluation = evaluateScenario("usdc-policy-preview");

    expect(evaluation.decision).toBe("approved");
    expect(evaluation.request.currency).toBe("USDC");
  });

  it("blocks an unsupported currency", () => {
    const request = {
      ...DEMO_SCENARIOS[0].request,
      requestId: "GCA-CURRENCY-006",
      currency: "BTC",
    };
    const evaluation = evaluateCommerceRequest(
      GUARDED_COMMERCE_POLICY,
      request,
    );

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toContain("currency");
  });

  it("blocks a request that would exceed the daily budget", () => {
    const request = {
      ...DEMO_SCENARIOS[0].request,
      requestId: "GCA-BUDGET-007",
      amountAtomic: "300000000",
      spentTodayAtomic: "1000000000",
    };
    const evaluation = evaluateCommerceRequest(
      GUARDED_COMMERCE_POLICY,
      request,
    );

    expect(evaluation.decision).toBe("blocked");
    expect(evaluation.blockedBy).toEqual(["daily_budget"]);
  });
});
