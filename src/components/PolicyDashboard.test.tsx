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
        name: "Agent Kit tool execution disabled in Phase 2",
      }),
    ).toBeDisabled();
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
    expect(fetch).toHaveBeenCalledWith(
      "/api/runtime/evaluate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scenarioId: "unknown-recipient" }),
      }),
    );
  });
});
