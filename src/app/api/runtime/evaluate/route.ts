import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtime";
import {
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";

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

  const scenario = getDemoScenarioById(body.scenarioId);
  if (!scenario) {
    return Response.json(
      { error: "Unknown demo scenario." },
      { status: 404 },
    );
  }

  return Response.json(
    runGuardedCommerceDryRun(
      scenario.id,
      scenario.request,
      GUARDED_COMMERCE_POLICY,
    ),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
