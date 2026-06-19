import type { GuardedCommerceReceipt } from "./receipt";

export type SupportedCurrency = "HBAR";

export type PolicyCheckKey =
  | "max_spend"
  | "allowed_counterparty"
  | "allowed_purpose"
  | "currency"
  | "daily_budget"
  | "human_approval";

export type PolicyDecision = "approved" | "blocked" | "escalated";

export type PolicyCheckResult = "pass" | "block" | "escalate";

export type PolicyCheck = {
  key: PolicyCheckKey;
  label: string;
  result: PolicyCheckResult;
  passed: boolean;
  expected: string;
  observed: string;
};

export type CurrencyPolicy = {
  currency: SupportedCurrency;
  decimals: number;
  maxSpendAtomic: string;
  dailyBudgetAtomic: string;
  humanApprovalThresholdAtomic: string;
  status: "primary_demo";
};

export type CounterpartyPolicy = {
  accountId: string;
  label: string;
};

export type GuardedCommercePolicy = {
  currencies: Record<SupportedCurrency, CurrencyPolicy>;
  allowedCounterparties: CounterpartyPolicy[];
  allowedPurposes: string[];
};

export type CommerceRequest = {
  requestId: string;
  serviceName: string;
  recipientAccountId: string;
  purpose: string;
  currency: string;
  amountAtomic: string;
  spentTodayAtomic: string;
};

export type PolicyEvaluation = {
  decision: PolicyDecision;
  request: CommerceRequest;
  checks: PolicyCheck[];
  blockedBy: PolicyCheckKey[];
  escalatedBy: PolicyCheckKey[];
};

export type MockProofEventType =
  | "request_received"
  | "policy_evaluated"
  | "mock_action_approved"
  | "mock_action_blocked"
  | "mock_action_escalated"
  | "mock_policy_receipt_created";

export type MockProofEvent = {
  type: MockProofEventType;
  occurredAt: string;
  detail: string;
};

export type MockPolicyProof = {
  schemaVersion: "pfn.guarded-commerce-policy-proof.v1";
  proofId: string;
  generatedAt: string;
  mode: "mock_only";
  decision: PolicyDecision;
  receiptStatus:
    | "fulfillment-ready"
    | "blocked"
    | "owner-review-required";
  receipt: GuardedCommerceReceipt;
  liveSpendPerformed: false;
  ledgerReceiptIssued: false;
  hederaTransactionId: null;
  hcsTopicId: null;
  checks: PolicyCheck[];
  events: MockProofEvent[];
};

export type DemoScenario = {
  id: string;
  label: string;
  description: string;
  request: CommerceRequest;
};
