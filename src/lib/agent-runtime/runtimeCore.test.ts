import { AbstractPolicy, AgentMode } from "@hashgraph/hedera-agent-kit";
import { coreAccountPluginToolNames } from "@hashgraph/hedera-agent-kit/plugins";
import { describe, expect, it } from "vitest";

import { createGuardedCommercePolicyAdapters } from "./policies";
import { runGuardedCommerceDryRun } from "./runtimeCore";
import {
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "../policy/scenarios";

function runScenario(scenarioId: string) {
  const scenario = getDemoScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  return runGuardedCommerceDryRun(
    scenario.id,
    scenario.request,
    GUARDED_COMMERCE_POLICY,
    "2026-06-15T21:00:00.000Z",
  );
}

describe("runGuardedCommerceDryRun", () => {
  it("registers five Agent Kit policy adapters", () => {
    const adapters = createGuardedCommercePolicyAdapters();

    expect(adapters).toHaveLength(5);
    expect(adapters.every((adapter) => adapter instanceof AbstractPolicy)).toBe(
      true,
    );
    expect(adapters.map(({ name }) => name)).toEqual([
      "MaxSpendPolicy",
      "AllowedCounterpartyPolicy",
      "AllowedPurposePolicy",
      "CurrencyPolicy",
      "DailyBudgetPolicy",
    ]);
  });

  it("lets an approved HBAR request reach only the dry-run boundary", () => {
    const run = runScenario("approved-hbar");

    expect(run.evaluation.decision).toBe("approved");
    expect(run.executionBoundary).toBe("reached");
    expect(run.agentKit.mode).toBe(AgentMode.RETURN_BYTES);
    expect(run.agentKit.toolMethod).toBe(
      coreAccountPluginToolNames.TRANSFER_HBAR_TOOL,
    );
    expect(run.actionPreview).not.toBeNull();
    expect(run.safety).toEqual({
      clientCreated: false,
      transactionBuilt: false,
      transactionBytesCreated: false,
      walletSignatureRequested: false,
      networkSubmitted: false,
      hcsWritten: false,
      persistencePerformed: false,
      secretsRead: false,
    });
    expect(run.lifecycle.at(-1)?.stage).toBe(
      "dry_run_execution_boundary_reached",
    );
  });

  it("stops a blocked request before the execution boundary", () => {
    const run = runScenario("unknown-recipient");

    expect(run.evaluation.decision).toBe("blocked");
    expect(run.executionBoundary).toBe("not_reached");
    expect(run.actionPreview).toBeNull();
    expect(run.lifecycle.at(-1)).toEqual(
      expect.objectContaining({
        stage: "blocked_before_execution",
        status: "blocked",
      }),
    );
  });

  it("keeps USDC as a policy-only preview tool", () => {
    const run = runScenario("usdc-policy-preview");

    expect(run.evaluation.decision).toBe("approved");
    expect(run.agentKit.toolMethod).toBe("pfn_usdc_policy_preview_tool");
    expect(run.safety.transactionBuilt).toBe(false);
    expect(run.safety.networkSubmitted).toBe(false);
  });
});
