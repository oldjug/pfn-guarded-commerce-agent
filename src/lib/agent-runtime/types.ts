import type { PolicyEvaluation } from "@/lib/policy/types";

export type RuntimeLifecycleStage =
  | "user_request_received"
  | "intent_normalized"
  | "agent_kit_policies_registered"
  | "policy_evaluated"
  | "dry_run_execution_boundary_reached"
  | "blocked_before_execution";

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
  clientCreated: false;
  transactionBuilt: false;
  transactionBytesCreated: false;
  walletSignatureRequested: false;
  networkSubmitted: false;
  hcsWritten: false;
  persistencePerformed: false;
  secretsRead: false;
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
