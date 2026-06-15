import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtimeCore";
import type {
  HbarTransferExecutionInput,
  HbarTransferReceipt,
  LiveHbarExecutionSafety,
  PolicyGatedHbarExecutionResult,
  RuntimeLifecycleRecord,
} from "@/lib/agent-runtime/types";
import type {
  CommerceRequest,
  GuardedCommercePolicy,
} from "@/lib/policy/types";

export type HbarTransferExecutor = (
  input: HbarTransferExecutionInput,
) => Promise<HbarTransferReceipt>;

type PolicyGatedHbarExecutionOptions = {
  scenarioId: string;
  request: CommerceRequest;
  policy: GuardedCommercePolicy;
  executeHbarTransfer: HbarTransferExecutor;
  occurredAt?: string;
};

function createSafety(
  overrides: Partial<LiveHbarExecutionSafety> = {},
): LiveHbarExecutionSafety {
  return {
    clientCreated: false,
    transactionBuilt: false,
    transactionBytesReturned: false,
    walletSignatureRequested: false,
    networkSubmitted: false,
    hcsWritten: false,
    persistencePerformed: false,
    secretsRead: false,
    mainnetAllowed: false,
    ...overrides,
  };
}

function appendLifecycle(
  lifecycle: RuntimeLifecycleRecord[],
  record: RuntimeLifecycleRecord,
) {
  return [...lifecycle, record];
}

export async function executePolicyGatedHbarTransfer({
  scenarioId,
  request,
  policy,
  executeHbarTransfer,
  occurredAt = new Date().toISOString(),
}: PolicyGatedHbarExecutionOptions): Promise<PolicyGatedHbarExecutionResult> {
  const runtimeRun = runGuardedCommerceDryRun(
    scenarioId,
    request,
    policy,
    occurredAt,
  );

  if (runtimeRun.evaluation.decision !== "approved") {
    return {
      schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
      scenarioId,
      status: "policy_blocked",
      message:
        "Policy blocked this request before Hedera client or transfer creation.",
      runtimeRun,
      receipt: null,
      lifecycle: runtimeRun.lifecycle,
      safety: createSafety(),
    };
  }

  if (runtimeRun.normalizedIntent.currency !== "HBAR") {
    return {
      schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
      scenarioId,
      status: "fail_closed",
      message: "Live execution is limited to HBAR testnet transfers in Phase 3.",
      runtimeRun,
      receipt: null,
      lifecycle: appendLifecycle(runtimeRun.lifecycle, {
        stage: "live_execution_failed_closed",
        status: "blocked",
        occurredAt,
        detail:
          "The approved request was not HBAR, so live execution failed closed.",
      }),
      safety: createSafety(),
    };
  }

  const requestedLifecycle = appendLifecycle(runtimeRun.lifecycle, {
    stage: "live_hbar_execution_requested",
    status: "completed",
    occurredAt,
    detail:
      "All policies passed. The server-only HBAR testnet execution boundary was requested.",
  });

  try {
    const receipt = await executeHbarTransfer({
      recipientAccountId: runtimeRun.normalizedIntent.recipientAccountId,
      amountTinybars: runtimeRun.normalizedIntent.amountAtomic,
      memo: runtimeRun.normalizedIntent.transactionMemo,
    });
    const lifecycle = [
      ...requestedLifecycle,
      {
        stage: "hedera_testnet_client_ready",
        status: "completed",
        occurredAt: receipt.executedAt,
        detail:
          "Hedera testnet client was created from server environment credentials.",
      },
      {
        stage: "hbar_transfer_submitted",
        status: "completed",
        occurredAt: receipt.executedAt,
        detail: `Submitted HBAR transfer ${receipt.transactionId}.`,
      },
      {
        stage: "hedera_receipt_received",
        status: "completed",
        occurredAt: receipt.executedAt,
        detail: `Received Hedera receipt status ${receipt.receiptStatus}.`,
      },
    ] satisfies RuntimeLifecycleRecord[];

    return {
      schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
      scenarioId,
      status: "submitted",
      message:
        "Policy approved the request and Hedera testnet returned a transaction receipt.",
      runtimeRun: {
        ...runtimeRun,
        safety: {
          clientCreated: true,
          transactionBuilt: true,
          transactionBytesCreated: false,
          walletSignatureRequested: false,
          networkSubmitted: true,
          hcsWritten: false,
          persistencePerformed: false,
          secretsRead: true,
        },
      },
      receipt,
      lifecycle,
      safety: createSafety({
        clientCreated: true,
        transactionBuilt: true,
        networkSubmitted: true,
        secretsRead: true,
      }),
    };
  } catch (error) {
    return {
      schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
      scenarioId,
      status: "fail_closed",
      message:
        error instanceof Error
          ? error.message
          : "Hedera HBAR execution failed closed.",
      runtimeRun,
      receipt: null,
      lifecycle: appendLifecycle(requestedLifecycle, {
        stage: "live_execution_failed_closed",
        status: "blocked",
        occurredAt,
        detail:
          "The server-only HBAR execution boundary failed before returning a receipt.",
      }),
      safety: createSafety({ secretsRead: true }),
    };
  }
}
