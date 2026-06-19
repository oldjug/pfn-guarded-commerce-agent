import type {
  HbarTransferReceipt,
  HcsAuditCheckpointInput,
  HcsAuditReceipt,
} from "@/lib/agent-runtime/types";

import type { PolicyDecision, PolicyEvaluation } from "./types";

export const PFN_GUARDED_COMMERCE_PROJECT =
  "PFN Guarded Commerce Agent" as const;
export const PFN_GUARDED_COMMERCE_POLICY_VERSION =
  "pfn-guarded-commerce-v1" as const;
export const PFN_FEATURE_UNLOCK_LABEL = "PFN Feature Unlock" as const;
export const PFN_FULFILLMENT_TARGET =
  "XRP / XRPL EVM Feature NFT" as const;

export type HcsAuditPolicyDecision = "allowed" | "blocked" | "escalated";

export type GuardedCommerceReceiptStatus =
  | "fulfillment-ready"
  | "blocked"
  | "owner-review-required";

export type GuardedCommerceReceipt = {
  project: typeof PFN_GUARDED_COMMERCE_PROJECT;
  rail: "hedera";
  sourcePayment: string;
  feature: typeof PFN_FEATURE_UNLOCK_LABEL;
  fulfillmentTarget: typeof PFN_FULFILLMENT_TARGET;
  decision: HcsAuditPolicyDecision;
  policyVersion: typeof PFN_GUARDED_COMMERCE_POLICY_VERSION;
  receiptId: string;
  hcsTopicId: string | null;
  hcsSequenceNumber: string | null;
  status: GuardedCommerceReceiptStatus;
};

export function mapPolicyDecisionForAudit(
  decision: PolicyDecision,
): HcsAuditPolicyDecision {
  if (decision === "approved") return "allowed";
  return decision;
}

export function receiptStatusForDecision(
  decision: PolicyDecision,
): GuardedCommerceReceiptStatus {
  if (decision === "approved") return "fulfillment-ready";
  if (decision === "escalated") return "owner-review-required";
  return "blocked";
}

export function createGuardedCommerceReceipt(
  evaluation: PolicyEvaluation,
  hcsAudit: HcsAuditReceipt | null = null,
): GuardedCommerceReceipt {
  return {
    project: PFN_GUARDED_COMMERCE_PROJECT,
    rail: "hedera",
    sourcePayment:
      evaluation.decision === "approved"
        ? "HBAR testnet tx or verified payment proof"
        : "No HBAR payment submitted",
    feature: PFN_FEATURE_UNLOCK_LABEL,
    fulfillmentTarget: PFN_FULFILLMENT_TARGET,
    decision: mapPolicyDecisionForAudit(evaluation.decision),
    policyVersion: PFN_GUARDED_COMMERCE_POLICY_VERSION,
    receiptId: `pfn-gca:${evaluation.request.requestId}`,
    hcsTopicId: hcsAudit?.topicId ?? null,
    hcsSequenceNumber: hcsAudit?.topicSequenceNumber ?? null,
    status: receiptStatusForDecision(evaluation.decision),
  };
}

export function createHcsAuditInputForEvaluation(args: {
  scenarioId: string;
  evaluation: PolicyEvaluation;
  occurredAt: string;
  hbarReceipt?: HbarTransferReceipt | null;
}): HcsAuditCheckpointInput {
  const receipt = createGuardedCommerceReceipt(args.evaluation);
  const hbarReceipt = args.hbarReceipt ?? null;

  return {
    schemaVersion: "pfn.guarded-commerce-hcs-audit-input.v1",
    scenarioId: args.scenarioId,
    requestId: args.evaluation.request.requestId,
    serviceName: args.evaluation.request.serviceName,
    policyDecision: receipt.decision,
    policyVersion: receipt.policyVersion,
    receiptId: receipt.receiptId,
    receiptStatus: receipt.status,
    feature: receipt.feature,
    fulfillmentTarget: receipt.fulfillmentTarget,
    hbarTransactionId: hbarReceipt?.transactionId ?? null,
    hbarReceiptStatus: hbarReceipt?.receiptStatus ?? null,
    recipientAccountId: args.evaluation.request.recipientAccountId,
    amountAtomic: args.evaluation.request.amountAtomic,
    currency: args.evaluation.request.currency,
    memo: `PFN-GCA:${args.evaluation.request.requestId}`,
    blockedBy: args.evaluation.blockedBy,
    escalatedBy: args.evaluation.escalatedBy,
    occurredAt: hbarReceipt?.executedAt ?? args.occurredAt,
  };
}
