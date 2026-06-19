import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let post: typeof import("./route").POST;

beforeAll(async () => {
  ({ POST: post } = await import("./route"));
});

describe("POST /api/audit", () => {
  it("fails closed for a known policy decision when HCS env is missing", async () => {
    const response = await post(
      new Request("http://localhost/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "escalated-owner-review" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("fail_closed");
    expect(body.runtimeRun.evaluation.decision).toBe("escalated");
    expect(body.hcsAudit).toBeNull();
    expect(body.safety.hcsWritten).toBe(false);
  });

  it("returns 404 for an unknown scenario", async () => {
    const response = await post(
      new Request("http://localhost/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "not-real" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Unknown demo scenario.",
    });
  });
});
