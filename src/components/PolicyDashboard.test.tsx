import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyDashboard } from "./PolicyDashboard";

describe("PolicyDashboard", () => {
  it("shows the approved HBAR scenario as mock-only", () => {
    render(<PolicyDashboard />);

    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("Mock action ready")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Live Hedera spend disabled in Phase 1",
      }),
    ).toBeDisabled();
    expect(screen.getByText("Transaction ID: none")).toBeInTheDocument();
  });

  it("switches to and blocks the unknown recipient scenario", () => {
    render(<PolicyDashboard />);

    fireEvent.click(
      screen.getByRole("button", { name: /Unknown recipient/i }),
    );

    expect(screen.getByText("Action blocked")).toBeInTheDocument();
    expect(screen.getAllByText("0.0.9999999")).not.toHaveLength(0);
    expect(
      screen.getByText("mock action blocked", { exact: false }),
    ).toBeInTheDocument();
  });
});
