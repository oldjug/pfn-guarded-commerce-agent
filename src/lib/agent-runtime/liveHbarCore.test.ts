import { describe, expect, it, vi } from "vitest";

import { executePolicyGatedHbarTransfer } from "@/lib/agent-runtime/liveHbarCore";
import {
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";

function getScenario(scenarioId: string) {
  const scenario = getDemoScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  return scenario;
}

function fakeReceipt() {
  return {
    network: "testnet" as const,
    transactionId: "0.0.1234@1710000000.000000000",
    nodeId: "0.0.3",
    transactionHash: "abc123",
    receiptStatus: "SUCCESS",
    recipientAccountId: "0.0.9186153",
    amountTinybars: "100000000",
    memo: "PFN-GCA:GCA-APPROVED-001",
    executedAt: "2026-06-15T22:00:00.000Z",
  };
}

function fakeHcsAudit() {
  return {
    network: "testnet" as const,
    topicId: "0.0.7001",
    transactionId: "0.0.1234@1710000001.000000000",
    nodeId: "0.0.3",
    transactionHash: "def456",
    receiptStatus: "SUCCESS",
    topicSequenceNumber: "42",
    topicRunningHash: "feedface",
    messageHash: "0123456789abcdef",
    submittedAt: "2026-06-15T22:00:05.000Z",
  };
}

describe("executePolicyGatedHbarTransfer", () => {
  it("submits approved HBAR and writes an HCS audit checkpoint", async () => {
    const scenario = getScenario("approved-hbar");
    const executeHbarTransfer = vi.fn().mockResolvedValue(fakeReceipt());
    const assertHcsAuditReady = vi.fn();
    const submitHcsAudit = vi.fn().mockResolvedValue(fakeHcsAudit());

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      assertHcsAuditReady,
      submitHcsAudit,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("submitted");
    expect(result.receipt?.receiptStatus).toBe("SUCCESS");
    expect(result.hcsAudit?.topicId).toBe("0.0.7001");
    expect(result.safety.clientCreated).toBe(true);
    expect(result.safety.networkSubmitted).toBe(true);
    expect(result.safety.hcsWritten).toBe(true);
    expect(result.safety.mainnetAllowed).toBe(false);
    expect(assertHcsAuditReady).toHaveBeenCalledOnce();
    expect(executeHbarTransfer).toHaveBeenCalledExactlyOnceWith({
      recipientAccountId: "0.0.9186153",
      amountTinybars: "100000000",
      memo: "PFN-GCA:GCA-APPROVED-001",
    });
    expect(submitHcsAudit).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        hbarTransactionId: "0.0.1234@1710000000.000000000",
        requestId: "GCA-APPROVED-001",
        policyDecision: "approved",
      }),
    );
    expect(result.lifecycle.map(({ stage }) => stage)).toContain(
      "hcs_receipt_received",
    );
  });

  it("does not create a Hedera client or call the executor for blocked policy", async () => {
    const scenario = getScenario("unknown-recipient");
    const executeHbarTransfer = vi.fn();
    const assertHcsAuditReady = vi.fn();
    const submitHcsAudit = vi.fn();

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      assertHcsAuditReady,
      submitHcsAudit,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("policy_blocked");
    expect(result.receipt).toBeNull();
    expect(result.safety.clientCreated).toBe(false);
    expect(result.safety.networkSubmitted).toBe(false);
    expect(executeHbarTransfer).not.toHaveBeenCalled();
    expect(assertHcsAuditReady).not.toHaveBeenCalled();
    expect(submitHcsAudit).not.toHaveBeenCalled();
  });

  it("fails closed for approved non-HBAR requests before executor call", async () => {
    const scenario = getScenario("usdc-policy-preview");
    const executeHbarTransfer = vi.fn();
    const assertHcsAuditReady = vi.fn();
    const submitHcsAudit = vi.fn();

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      assertHcsAuditReady,
      submitHcsAudit,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("fail_closed");
    expect(result.message).toMatch(/limited to HBAR/i);
    expect(result.safety.clientCreated).toBe(false);
    expect(executeHbarTransfer).not.toHaveBeenCalled();
    expect(assertHcsAuditReady).not.toHaveBeenCalled();
    expect(submitHcsAudit).not.toHaveBeenCalled();
  });

  it("fails closed before HBAR transfer when HCS audit env is missing", async () => {
    const scenario = getScenario("approved-hbar");
    const executeHbarTransfer = vi.fn();
    const assertHcsAuditReady = vi
      .fn()
      .mockImplementation(() => {
        throw new Error("Missing HEDERA_HCS_TOPIC_ID.");
      });
    const submitHcsAudit = vi.fn();

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      assertHcsAuditReady,
      submitHcsAudit,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("fail_closed");
    expect(result.message).toBe("Missing HEDERA_HCS_TOPIC_ID.");
    expect(result.receipt).toBeNull();
    expect(result.hcsAudit).toBeNull();
    expect(result.safety.networkSubmitted).toBe(false);
    expect(executeHbarTransfer).not.toHaveBeenCalled();
    expect(submitHcsAudit).not.toHaveBeenCalled();
  });

  it("fails closed when the execution boundary throws", async () => {
    const scenario = getScenario("approved-hbar");
    const executeHbarTransfer = vi
      .fn()
      .mockRejectedValue(new Error("Missing HEDERA_OPERATOR_PRIVATE_KEY."));

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("fail_closed");
    expect(result.message).toBe("Missing HEDERA_OPERATOR_PRIVATE_KEY.");
    expect(result.receipt).toBeNull();
    expect(result.safety.networkSubmitted).toBe(false);
    expect(result.lifecycle.at(-1)?.stage).toBe(
      "live_execution_failed_closed",
    );
  });

  it("fails closed when HCS audit write fails after HBAR receipt", async () => {
    const scenario = getScenario("approved-hbar");
    const executeHbarTransfer = vi.fn().mockResolvedValue(fakeReceipt());
    const submitHcsAudit = vi
      .fn()
      .mockRejectedValue(new Error("HCS topic rejected audit message."));

    const result = await executePolicyGatedHbarTransfer({
      scenarioId: scenario.id,
      request: scenario.request,
      policy: GUARDED_COMMERCE_POLICY,
      executeHbarTransfer,
      assertHcsAuditReady: vi.fn(),
      submitHcsAudit,
      occurredAt: "2026-06-15T21:00:00.000Z",
    });

    expect(result.status).toBe("fail_closed");
    expect(result.message).toBe("HCS topic rejected audit message.");
    expect(result.receipt?.transactionId).toBe(
      "0.0.1234@1710000000.000000000",
    );
    expect(result.hcsAudit).toBeNull();
    expect(result.safety.networkSubmitted).toBe(true);
    expect(result.safety.hcsWritten).toBe(false);
    expect(result.lifecycle.at(-1)?.stage).toBe("hcs_audit_failed_closed");
  });
});
