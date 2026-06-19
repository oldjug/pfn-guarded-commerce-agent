import "server-only";

import { submitHcsAuditCheckpoint } from "@/lib/hedera/hcsAudit";
import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtimeCore";
import type { HcsAuditSubmitter } from "@/lib/agent-runtime/liveHbarCore";
import type {
  PolicyDecisionHcsAuditResult,
  PolicyDecisionHcsAuditSafety,
} from "@/lib/agent-runtime/types";
import {
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";
import { createHcsAuditInputForEvaluation } from "@/lib/policy/receipt";

function createSafety(
  overrides: Partial<PolicyDecisionHcsAuditSafety> = {},
): PolicyDecisionHcsAuditSafety {
  return {
    hcsWritten: false,
    persistencePerformed: false,
    secretsRead: false,
    mainnetAllowed: false,
    ...overrides,
  };
}

export async function submitPolicyDecisionHcsAuditForScenario(
  scenarioId: string,
  submitHcsAudit: HcsAuditSubmitter = submitHcsAuditCheckpoint,
  occurredAt = new Date().toISOString(),
): Promise<PolicyDecisionHcsAuditResult | null> {
  const scenario = getDemoScenarioById(scenarioId);
  if (!scenario) {
    return null;
  }

  const runtimeRun = runGuardedCommerceDryRun(
    scenario.id,
    scenario.request,
    GUARDED_COMMERCE_POLICY,
    occurredAt,
  );

  try {
    const hcsAudit = await submitHcsAudit(
      createHcsAuditInputForEvaluation({
        scenarioId: scenario.id,
        evaluation: runtimeRun.evaluation,
        occurredAt,
      }),
    );

    return {
      schemaVersion: "pfn.guarded-commerce-policy-hcs-audit.v1",
      scenarioId: scenario.id,
      status: "submitted",
      message:
        "HCS recorded the policy decision audit checkpoint for this scenario.",
      runtimeRun,
      hcsAudit,
      safety: createSafety({ hcsWritten: true, secretsRead: true }),
    };
  } catch (error) {
    return {
      schemaVersion: "pfn.guarded-commerce-policy-hcs-audit.v1",
      scenarioId: scenario.id,
      status: "fail_closed",
      message:
        error instanceof Error
          ? error.message
          : "HCS policy decision audit failed closed.",
      runtimeRun,
      hcsAudit: null,
      safety: createSafety({ secretsRead: true }),
    };
  }
}
