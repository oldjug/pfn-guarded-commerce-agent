import { executePolicyGatedHbarTransferForScenario } from "@/lib/agent-runtime/liveHbarRuntime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("scenarioId" in body) ||
    typeof body.scenarioId !== "string"
  ) {
    return Response.json(
      { error: "A valid scenarioId is required." },
      { status: 400 },
    );
  }

  const result = await executePolicyGatedHbarTransferForScenario(
    body.scenarioId,
  );
  if (!result) {
    return Response.json(
      { error: "Unknown demo scenario." },
      { status: 404 },
    );
  }

  return Response.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
