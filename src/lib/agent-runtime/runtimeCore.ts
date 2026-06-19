import { AgentMode } from "@hashgraph/hedera-agent-kit";
import { coreAccountPluginToolNames } from "@hashgraph/hedera-agent-kit/plugins";

import {
  PFN_UNSUPPORTED_CURRENCY_POLICY_PREVIEW_TOOL,
  createGuardedCommercePolicyAdapters,
} from "@/lib/agent-runtime/policies";
import type {
  GuardedCommerceRuntimeRun,
  NormalizedCommerceIntent,
  RuntimeLifecycleRecord,
} from "@/lib/agent-runtime/types";
import { evaluateCommerceRequest } from "@/lib/policy/policyEngine";
import type {
  CommerceRequest,
  GuardedCommercePolicy,
  PolicyEvaluation,
} from "@/lib/policy/types";

function normalizeCommerceIntent(
  request: CommerceRequest,
): NormalizedCommerceIntent {
  const toolMethod =
    request.currency === "HBAR"
      ? coreAccountPluginToolNames.TRANSFER_HBAR_TOOL
      : PFN_UNSUPPORTED_CURRENCY_POLICY_PREVIEW_TOOL;

  return {
    ...request,
    transactionMemo: `PFN-GCA:${request.requestId}`,
    toolMethod,
  };
}

function evaluateRuntimePolicies(
  policy: GuardedCommercePolicy,
  request: CommerceRequest,
): {
  evaluation: PolicyEvaluation;
  registeredPolicies: string[];
} {
  const baseEvaluation = evaluateCommerceRequest(policy, request);
  const policyAdapters = createGuardedCommercePolicyAdapters();
  const checks = policyAdapters.map((adapter) =>
    adapter.readCheck(baseEvaluation),
  );
  const blockedBy = checks
    .filter(({ result }) => result === "block")
    .map(({ key }) => key);
  const escalatedBy = checks
    .filter(({ result }) => result === "escalate")
    .map(({ key }) => key);

  return {
    evaluation: {
      ...baseEvaluation,
      decision:
        blockedBy.length > 0
          ? "blocked"
          : escalatedBy.length > 0
            ? "escalated"
            : "approved",
      checks,
      blockedBy,
      escalatedBy,
    },
    registeredPolicies: policyAdapters.map(({ name }) => name),
  };
}

export function runGuardedCommerceDryRun(
  scenarioId: string,
  request: CommerceRequest,
  policy: GuardedCommercePolicy,
  occurredAt = new Date().toISOString(),
): GuardedCommerceRuntimeRun {
  const normalizedIntent = normalizeCommerceIntent(request);
  const { evaluation, registeredPolicies } = evaluateRuntimePolicies(
    policy,
    request,
  );
  const approved = evaluation.decision === "approved";
  const escalated = evaluation.decision === "escalated";
  const lifecycle: RuntimeLifecycleRecord[] = [
    {
      stage: "user_request_received",
      status: "completed",
      occurredAt,
      detail: `Received service request ${request.requestId}.`,
    },
    {
      stage: "intent_normalized",
      status: "completed",
      occurredAt,
      detail: `Normalized request for ${normalizedIntent.toolMethod}.`,
    },
    {
      stage: "agent_kit_policies_registered",
      status: "completed",
      occurredAt,
      detail: `Registered ${registeredPolicies.length} Agent Kit policy adapters at post-parameter normalization.`,
    },
    {
      stage: "policy_evaluated",
      status: approved ? "completed" : escalated ? "escalated" : "blocked",
      occurredAt,
      detail: approved
        ? "All runtime policies passed."
        : escalated
          ? `Escalated for owner review by ${evaluation.escalatedBy.join(", ")}.`
          : `Blocked by ${evaluation.blockedBy.join(", ")}.`,
    },
    approved
      ? {
          stage: "dry_run_execution_boundary_reached",
          status: "completed",
          occurredAt,
          detail:
            "Approved action reached the dry-run boundary. Tool execution was intentionally not invoked.",
        }
      : escalated
        ? {
            stage: "escalated_for_owner_review",
            status: "escalated",
            occurredAt,
            detail:
              "The runtime stopped before tool execution and marked the request for human approval.",
          }
      : {
          stage: "blocked_before_execution",
          status: "blocked",
          occurredAt,
          detail:
            "The runtime stopped before tool execution, transaction construction, or wallet interaction.",
        },
  ];

  return {
    schemaVersion: "pfn.guarded-commerce-runtime.v1",
    runId: `runtime:${request.requestId}`,
    scenarioId,
    startedAt: occurredAt,
    completedAt: occurredAt,
    agentKit: {
      packageName: "@hashgraph/hedera-agent-kit",
      packageVersion: "4.0.0",
      mode: AgentMode.RETURN_BYTES,
      hookPhase: "post_params_normalization",
      toolMethod: normalizedIntent.toolMethod,
      registeredPolicies,
    },
    normalizedIntent,
    evaluation,
    executionBoundary: approved ? "reached" : "not_reached",
    actionPreview: approved
      ? {
          toolMethod: normalizedIntent.toolMethod,
          mode: AgentMode.RETURN_BYTES,
          recipientAccountId: normalizedIntent.recipientAccountId,
          currency: normalizedIntent.currency,
          amountAtomic: normalizedIntent.amountAtomic,
          transactionMemo: normalizedIntent.transactionMemo,
        }
      : null,
    safety: {
      clientCreated: false,
      transactionBuilt: false,
      transactionBytesCreated: false,
      walletSignatureRequested: false,
      networkSubmitted: false,
      hcsWritten: false,
      persistencePerformed: false,
      secretsRead: false,
    },
    lifecycle,
  };
}
