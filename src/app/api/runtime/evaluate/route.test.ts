import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let post: typeof import("./route").POST;

beforeAll(async () => {
  ({ POST: post } = await import("./route"));
});

describe("POST /api/runtime/evaluate", () => {
  it("returns a dry-run runtime result for a known scenario", async () => {
    const response = await post(
      new Request("http://localhost/api/runtime/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "approved-hbar" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.executionBoundary).toBe("reached");
    expect(body.safety.networkSubmitted).toBe(false);
  });

  it("fails closed for an unknown scenario", async () => {
    const response = await post(
      new Request("http://localhost/api/runtime/evaluate", {
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
