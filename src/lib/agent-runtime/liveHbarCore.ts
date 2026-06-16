import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtimeCore";
import type {
  HcsAuditCheckpointInput,
  HcsAuditReceipt,
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

export type HcsAuditSubmitter = (
  input: HcsAuditCheckpointInput,
) => Promise<HcsAuditReceipt>;

type PolicyGatedHbarExecutionOptions = {
  scenarioId: string;
  request: CommerceRequest;
  policy: GuardedCommercePolicy;
  executeHbarTransfer: HbarTransferExecutor;
  assertHcsAuditReady?: () => void;
  submitHcsAudit?: HcsAuditSubmitter;
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
  assertHcsAuditReady,
  submitHcsAudit,
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
      hcsAudit: null,
      lifecycle: runtimeRun.lifecycle,
      safety: createSafety(),
    };
  }

  if (runtimeRun.normalizedIntent.currency !== "HBAR") {
    return {
      schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
      scenarioId,
      status: "fail_closed",
      message: "Live execution is limited to HBAR testnet transfers in Phase 5.",
      runtimeRun,
      receipt: null,
      hcsAudit: null,
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

  if (assertHcsAuditReady) {
    try {
      assertHcsAuditReady();
    } catch (error) {
      return {
        schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
        scenarioId,
        status: "fail_closed",
        message:
          error instanceof Error
            ? error.message
            : "HCS audit checkpoint failed closed before HBAR transfer.",
        runtimeRun,
        receipt: null,
        hcsAudit: null,
        lifecycle: appendLifecycle(runtimeRun.lifecycle, {
          stage: "hcs_audit_failed_closed",
          status: "blocked",
          occurredAt,
          detail:
            "The HCS audit topic was not ready, so the HBAR transfer was not submitted.",
        }),
        safety: createSafety(),
      };
    }
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
    let lifecycle = [
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

    if (submitHcsAudit) {
      lifecycle = appendLifecycle(lifecycle, {
        stage: "hcs_audit_requested",
        status: "completed",
        occurredAt: receipt.executedAt,
        detail:
          "HBAR receipt was returned. The server-only HCS audit checkpoint was requested.",
      });

      try {
        const hcsAudit = await submitHcsAudit({
          schemaVersion: "pfn.guarded-commerce-hcs-audit-input.v1",
          scenarioId,
          requestId: runtimeRun.normalizedIntent.requestId,
          serviceName: runtimeRun.normalizedIntent.serviceName,
          policyDecision: "approved",
          hbarTransactionId: receipt.transactionId,
          hbarReceiptStatus: receipt.receiptStatus,
          recipientAccountId: receipt.recipientAccountId,
          amountTinybars: receipt.amountTinybars,
          memo: receipt.memo,
          occurredAt: receipt.executedAt,
        });

        lifecycle = [
          ...lifecycle,
          {
            stage: "hcs_audit_submitted",
            status: "completed",
            occurredAt: hcsAudit.submittedAt,
            detail: `Submitted HCS audit transaction ${hcsAudit.transactionId}.`,
          },
          {
            stage: "hcs_receipt_received",
            status: "completed",
            occurredAt: hcsAudit.submittedAt,
            detail: `HCS topic ${hcsAudit.topicId} accepted sequence ${hcsAudit.topicSequenceNumber ?? "unavailable"}.`,
          },
        ] satisfies RuntimeLifecycleRecord[];

        return {
          schemaVersion: "pfn.guarded-commerce-live-hbar.v1",
          scenarioId,
          status: "submitted",
          message:
            "Policy approved the request, Hedera testnet returned a transaction receipt, and HCS recorded the audit checkpoint.",
          runtimeRun: {
            ...runtimeRun,
            safety: {
              clientCreated: true,
              transactionBuilt: true,
              transactionBytesCreated: false,
              walletSignatureRequested: false,
              networkSubmitted: true,
              hcsWritten: true,
              persistencePerformed: false,
              secretsRead: true,
            },
          },
          receipt,
          hcsAudit,
          lifecycle,
          safety: createSafety({
            clientCreated: true,
            transactionBuilt: true,
            networkSubmitted: true,
            hcsWritten: true,
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
              : "HCS audit checkpoint failed closed after HBAR receipt.",
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
          hcsAudit: null,
          lifecycle: appendLifecycle(lifecycle, {
            stage: "hcs_audit_failed_closed",
            status: "blocked",
            occurredAt: new Date().toISOString(),
            detail:
              "The HCS audit checkpoint failed after the HBAR receipt was returned.",
          }),
          safety: createSafety({
            clientCreated: true,
            transactionBuilt: true,
            networkSubmitted: true,
            secretsRead: true,
          }),
        };
      }
    }

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
      hcsAudit: null,
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
      hcsAudit: null,
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
