import { describe, expect, it } from "vitest";

import {
  DEMO_SCENARIOS,
  GUARDED_COMMERCE_POLICY,
} from "./scenarios";
import { evaluateCommerceRequest } from "./policyEngine";
import { createMockPolicyProof } from "./proofTrail";

describe("createMockPolicyProof", () => {
  it("records an approved decision without creating ledger proof", () => {
    const scenario = DEMO_SCENARIOS[0];
    const evaluation = evaluateCommerceRequest(
      GUARDED_COMMERCE_POLICY,
      scenario.request,
    );
    const proof = createMockPolicyProof(
      evaluation,
      "2026-06-15T12:00:00.000Z",
    );

    expect(proof.mode).toBe("mock_only");
    expect(proof.liveSpendPerformed).toBe(false);
    expect(proof.ledgerReceiptIssued).toBe(false);
    expect(proof.hederaTransactionId).toBeNull();
    expect(proof.hcsTopicId).toBeNull();
    expect(proof.receipt).toMatchObject({
      project: "PFN Guarded Commerce Agent",
      rail: "hedera",
      sourcePayment: "HBAR testnet tx or verified payment proof",
      feature: "PFN Feature Unlock",
      fulfillmentTarget: "XRP / XRPL EVM Feature NFT",
      decision: "allowed",
      policyVersion: "pfn-guarded-commerce-v1",
      receiptId: "pfn-gca:GCA-APPROVED-FEATURE-001",
      status: "fulfillment-ready",
    });
    expect(proof.events.map(({ type }) => type)).toContain(
      "mock_action_approved",
    );
  });
});
