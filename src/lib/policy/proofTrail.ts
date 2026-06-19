import type { MockPolicyProof, PolicyEvaluation } from "./types";
import { createGuardedCommerceReceipt } from "./receipt";

export function createMockPolicyProof(
  evaluation: PolicyEvaluation,
  generatedAt = new Date().toISOString(),
): MockPolicyProof {
  const actionEvent =
    evaluation.decision === "approved"
      ? {
          type: "mock_action_approved" as const,
          detail:
            "Policy approved a PFN feature-buy request. No transaction was created in this local proof preview.",
        }
      : evaluation.decision === "escalated"
        ? {
            type: "mock_action_escalated" as const,
            detail: `Policy requires owner review: ${evaluation.escalatedBy.join(", ")}.`,
          }
        : {
            type: "mock_action_blocked" as const,
            detail: `Policy blocked the simulated action: ${evaluation.blockedBy.join(", ")}.`,
          };
  const receipt = createGuardedCommerceReceipt(evaluation);

  return {
    schemaVersion: "pfn.guarded-commerce-policy-proof.v1",
    proofId: `policy-proof:${evaluation.request.requestId}`,
    generatedAt,
    mode: "mock_only",
    decision: evaluation.decision,
    receiptStatus: receipt.status,
    receipt,
    liveSpendPerformed: false,
    ledgerReceiptIssued: false,
    hederaTransactionId: null,
    hcsTopicId: null,
    checks: evaluation.checks,
    events: [
      {
        type: "request_received",
        occurredAt: generatedAt,
        detail: `Received ${evaluation.request.serviceName} request ${evaluation.request.requestId}.`,
      },
      {
        type: "policy_evaluated",
        occurredAt: generatedAt,
        detail: `Evaluated ${evaluation.checks.length} runtime policy checks.`,
      },
      {
        ...actionEvent,
        occurredAt: generatedAt,
      },
      {
        type: "mock_policy_receipt_created",
        occurredAt: generatedAt,
        detail: `Created a local PFN receipt preview for ${receipt.fulfillmentTarget}. It is not a Hedera payment or HCS receipt.`,
      },
    ],
  };
}
