import "server-only";

import {
  assertHcsAuditReady,
  submitHcsAuditCheckpoint,
} from "@/lib/hedera/hcsAudit";
import { executeTestnetHbarTransfer } from "@/lib/hedera/hbarTransfer";
import {
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";

import { executePolicyGatedHbarTransfer } from "./liveHbarCore";

export async function executePolicyGatedHbarTransferForScenario(
  scenarioId: string,
) {
  const scenario = getDemoScenarioById(scenarioId);
  if (!scenario) {
    return null;
  }

  return executePolicyGatedHbarTransfer({
    scenarioId: scenario.id,
    request: scenario.request,
    policy: GUARDED_COMMERCE_POLICY,
    executeHbarTransfer: executeTestnetHbarTransfer,
    assertHcsAuditReady,
    submitHcsAudit: submitHcsAuditCheckpoint,
  });
}
