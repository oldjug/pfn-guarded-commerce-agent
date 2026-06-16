import type { PolicyEvaluation } from "@/lib/policy/types";

export type RuntimeLifecycleStage =
  | "user_request_received"
  | "intent_normalized"
  | "agent_kit_policies_registered"
  | "policy_evaluated"
  | "dry_run_execution_boundary_reached"
  | "blocked_before_execution"
  | "live_hbar_execution_requested"
  | "hedera_testnet_client_ready"
  | "hbar_transfer_submitted"
  | "hedera_receipt_received"
  | "hcs_audit_preflight_ready"
  | "hcs_audit_requested"
  | "hcs_audit_submitted"
  | "hcs_receipt_received"
  | "hcs_audit_failed_closed"
  | "live_execution_failed_closed";

export type RuntimeLifecycleStatus = "completed" | "blocked";

export type RuntimeLifecycleRecord = {
  stage: RuntimeLifecycleStage;
  status: RuntimeLifecycleStatus;
  occurredAt: string;
  detail: string;
};

export type NormalizedCommerceIntent = {
  requestId: string;
  serviceName: string;
  recipientAccountId: string;
  purpose: string;
  currency: string;
  amountAtomic: string;
  spentTodayAtomic: string;
  transactionMemo: string;
  toolMethod: string;
};

export type DryRunActionPreview = {
  toolMethod: string;
  mode: "returnBytes";
  recipientAccountId: string;
  currency: string;
  amountAtomic: string;
  transactionMemo: string;
};

export type RuntimeSafetyBoundary = {
  clientCreated: boolean;
  transactionBuilt: boolean;
  transactionBytesCreated: boolean;
  walletSignatureRequested: false;
  networkSubmitted: boolean;
  hcsWritten: boolean;
  persistencePerformed: false;
  secretsRead: boolean;
};

export type GuardedCommerceRuntimeRun = {
  schemaVersion: "pfn.guarded-commerce-runtime.v1";
  runId: string;
  scenarioId: string;
  startedAt: string;
  completedAt: string;
  agentKit: {
    packageName: "@hashgraph/hedera-agent-kit";
    packageVersion: "4.0.0";
    mode: "returnBytes";
    hookPhase: "post_params_normalization";
    toolMethod: string;
    registeredPolicies: string[];
  };
  normalizedIntent: NormalizedCommerceIntent;
  evaluation: PolicyEvaluation;
  executionBoundary: "reached" | "not_reached";
  actionPreview: DryRunActionPreview | null;
  safety: RuntimeSafetyBoundary;
  lifecycle: RuntimeLifecycleRecord[];
};

export type HbarTransferExecutionInput = {
  recipientAccountId: string;
  amountTinybars: string;
  memo: string;
};

export type HbarTransferReceipt = {
  network: "testnet";
  transactionId: string;
  nodeId: string;
  transactionHash: string;
  receiptStatus: string;
  recipientAccountId: string;
  amountTinybars: string;
  memo: string;
  executedAt: string;
};

export type HcsAuditCheckpointInput = {
  schemaVersion: "pfn.guarded-commerce-hcs-audit-input.v1";
  scenarioId: string;
  requestId: string;
  serviceName: string;
  policyDecision: "approved";
  hbarTransactionId: string;
  hbarReceiptStatus: string;
  recipientAccountId: string;
  amountTinybars: string;
  memo: string;
  occurredAt: string;
};

export type HcsAuditReceipt = {
  network: "testnet";
  topicId: string;
  transactionId: string;
  nodeId: string;
  transactionHash: string;
  receiptStatus: string;
  topicSequenceNumber: string | null;
  topicRunningHash: string | null;
  messageHash: string;
  submittedAt: string;
};

export type LiveHbarExecutionStatus =
  | "submitted"
  | "policy_blocked"
  | "fail_closed";

export type LiveHbarExecutionSafety = {
  clientCreated: boolean;
  transactionBuilt: boolean;
  transactionBytesReturned: false;
  walletSignatureRequested: false;
  networkSubmitted: boolean;
  hcsWritten: boolean;
  persistencePerformed: false;
  secretsRead: boolean;
  mainnetAllowed: false;
};

export type PolicyGatedHbarExecutionResult = {
  schemaVersion: "pfn.guarded-commerce-live-hbar.v1";
  scenarioId: string;
  status: LiveHbarExecutionStatus;
  message: string;
  runtimeRun: GuardedCommerceRuntimeRun;
  receipt: HbarTransferReceipt | null;
  hcsAudit: HcsAuditReceipt | null;
  lifecycle: RuntimeLifecycleRecord[];
  safety: LiveHbarExecutionSafety;
};
