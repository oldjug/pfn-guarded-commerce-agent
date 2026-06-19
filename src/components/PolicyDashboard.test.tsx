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
      screen.getByText("XRP / XRPL EVM Feature NFT"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Direct Agent Kit tool execution disabled outside guarded live-HBAR path",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    ).toBeEnabled();
    expect(
      screen.getByText("Receipt ID: pfn-gca:GCA-APPROVED-FEATURE-001"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit HCS policy audit" }),
    ).toBeEnabled();
  });

  it("uses the runtime API and blocks an unknown recipient before execution", async () => {
    const blockedRun = createRuntimeRun("blocked-unknown-recipient");
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
        body: JSON.stringify({ scenarioId: "blocked-unknown-recipient" }),
      }),
    );
  });

  it("shows owner-review escalation before execution", async () => {
    const escalatedRun = createRuntimeRun("escalated-owner-review");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(escalatedRun), {
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

    fireEvent.click(screen.getByRole("button", { name: /Owner review/i }));

    expect(
      await screen.findByText("Owner review required"),
    ).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Execute policy-gated HBAR testnet transfer",
      }),
    ).toBeDisabled();
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
              amountTinybars: "200000000",
              memo: "PFN-GCA:GCA-APPROVED-FEATURE-001",
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

  it("submits the selected policy decision to the HCS audit route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            schemaVersion: "pfn.guarded-commerce-policy-hcs-audit.v1",
            scenarioId: DEFAULT_SCENARIO_ID,
            status: "submitted",
            message:
              "HCS recorded the policy decision audit checkpoint for this scenario.",
            hcsAudit: {
              network: "testnet",
              topicId: "0.0.7001",
              transactionId: "0.0.1234@1710000002.000000000",
              nodeId: "0.0.3",
              transactionHash: "abc789",
              receiptStatus: "SUCCESS",
              topicSequenceNumber: "43",
              topicRunningHash: "beadfeed",
              messageHash: "fedcba9876543210",
              submittedAt: "2026-06-15T22:00:06.000Z",
            },
            safety: {
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
      screen.getByRole("button", { name: "Submit HCS policy audit" }),
    );

    expect(await screen.findByText("Audit transaction")).toBeInTheDocument();
    expect(
      screen.getByText("0.0.1234@1710000002.000000000"),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/audit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scenarioId: DEFAULT_SCENARIO_ID }),
      }),
    );
  });
});
