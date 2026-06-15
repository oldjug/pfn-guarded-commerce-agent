export type SupportedCurrency = "HBAR" | "USDC";

export type PolicyCheckKey =
  | "max_spend"
  | "allowed_counterparty"
  | "allowed_purpose"
  | "currency"
  | "daily_budget";

export type PolicyDecision = "approved" | "blocked";

export type PolicyCheck = {
  key: PolicyCheckKey;
  label: string;
  passed: boolean;
  expected: string;
  observed: string;
};

export type CurrencyPolicy = {
  currency: SupportedCurrency;
  decimals: number;
  maxSpendAtomic: string;
  dailyBudgetAtomic: string;
  status: "primary_demo" | "policy_ready";
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
};

export type MockProofEventType =
  | "request_received"
  | "policy_evaluated"
  | "mock_action_approved"
  | "mock_action_blocked"
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
  receiptStatus: "mock_policy_receipt_created";
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
