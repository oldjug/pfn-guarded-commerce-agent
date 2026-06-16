import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let post: typeof import("./route").POST;

beforeAll(async () => {
  ({ POST: post } = await import("./route"));
});

describe("POST /api/runtime/execute-hbar", () => {
  it("fails closed for approved HBAR when local env is missing", async () => {
    const response = await post(
      new Request("http://localhost/api/runtime/execute-hbar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "approved-hbar" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("fail_closed");
    expect(body.receipt).toBeNull();
    expect(body.hcsAudit).toBeNull();
    expect(body.safety.networkSubmitted).toBe(false);
  });

  it("returns 403 for blocked policy before Hedera execution", async () => {
    const response = await post(
      new Request("http://localhost/api/runtime/execute-hbar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "unknown-recipient" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("policy_blocked");
    expect(body.receipt).toBeNull();
    expect(body.hcsAudit).toBeNull();
    expect(body.safety.clientCreated).toBe(false);
  });

  it("fails closed for approved USDC preview requests", async () => {
    const response = await post(
      new Request("http://localhost/api/runtime/execute-hbar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "usdc-policy-preview" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("fail_closed");
    expect(body.message).toMatch(/limited to HBAR/i);
  });
});
