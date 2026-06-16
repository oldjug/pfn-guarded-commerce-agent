import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtimeCore";
import {
  DEFAULT_SCENARIO_ID,
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";

import { PolicyDashboard } from "./PolicyDashboard";

function createRuntimeRun(scenarioId: string) {
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PolicyDashboard", () => {
  it("shows the approved HBAR scenario at the dry-run boundary", () => {
    render(
      <PolicyDashboard
        initialRuntimeRun={createRuntimeRun(DEFAULT_SCENARIO_ID)}
      />,
    );

    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("Dry-run boundary reached")).toBeInTheDocument();
    expect(screen.getByText("Would execute")).toBeInTheDocument();
    expect(screen.getByText("transfer_hbar_tool")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Direct Agent Kit tool execution disabled outside guarded Phase 5 path",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    ).toBeEnabled();
    expect(screen.getByText("Transaction ID: none")).toBeInTheDocument();
  });

  it("uses the runtime API and blocks an unknown recipient before execution", async () => {
    const blockedRun = createRuntimeRun("unknown-recipient");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(blockedRun), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(
      <PolicyDashboard
        initialRuntimeRun={createRuntimeRun(DEFAULT_SCENARIO_ID)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Unknown recipient/i }),
    );

    expect(
      await screen.findByText("Blocked before execution"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0.0.9999999")).not.toHaveLength(0);
    expect(
      screen.getByText(/No action preview was produced/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    ).toBeDisabled();
    expect(fetch).toHaveBeenCalledWith(
      "/api/runtime/evaluate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scenarioId: "unknown-recipient" }),
      }),
    );
  });

  it("shows fail-closed live HBAR execution feedback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
            status: "fail_closed",
            message: "Live HBAR execution is disabled.",
            receipt: null,
            hcsAudit: null,
            lifecycle: [],
            safety: {
              networkSubmitted: false,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(
      <PolicyDashboard
        initialRuntimeRun={createRuntimeRun(DEFAULT_SCENARIO_ID)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    );

    expect(await screen.findAllByText("Live HBAR execution is disabled.")).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      "/api/runtime/execute-hbar",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scenarioId: DEFAULT_SCENARIO_ID }),
      }),
    );
  });

  it("shows HCS audit references when approved live execution completes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
            scenarioId: DEFAULT_SCENARIO_ID,
            status: "submitted",
            message:
              "Policy approved the request, Hedera testnet returned a transaction receipt, and HCS recorded the audit checkpoint.",
            receipt: {
              network: "testnet",
              transactionId: "0.0.1234@1710000000.000000000",
              nodeId: "0.0.3",
              transactionHash: "abc123",
              receiptStatus: "SUCCESS",
              recipientAccountId: "0.0.9186153",
              amountTinybars: "100000000",
              memo: "PFN-GCA:GCA-APPROVED-001",
              executedAt: "2026-06-15T22:00:00.000Z",
            },
            hcsAudit: {
              network: "testnet",
              topicId: "0.0.7001",
              transactionId: "0.0.1234@1710000001.000000000",
              nodeId: "0.0.3",
              transactionHash: "def456",
              receiptStatus: "SUCCESS",
              topicSequenceNumber: "42",
              topicRunningHash: "feedface",
              messageHash: "0123456789abcdef",
              submittedAt: "2026-06-15T22:00:05.000Z",
            },
            lifecycle: [],
            safety: {
              networkSubmitted: true,
              hcsWritten: true,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(
      <PolicyDashboard
        initialRuntimeRun={createRuntimeRun(DEFAULT_SCENARIO_ID)}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    );

    expect(await screen.findByText("HCS topic")).toBeInTheDocument();
    expect(screen.getByText("0.0.7001")).toBeInTheDocument();
    expect(
      screen.getByText("0.0.1234@1710000001.000000000"),
    ).toBeInTheDocument();
  });
});
