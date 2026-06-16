import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let assertHcsAuditReady: typeof import("./hcsAudit").assertHcsAuditReady;
let createHcsAuditMessage: typeof import("./hcsAudit").createHcsAuditMessage;
let readHcsAuditConfig: typeof import("./hcsAudit").readHcsAuditConfig;

beforeAll(async () => {
  ({
    assertHcsAuditReady,
    createHcsAuditMessage,
    readHcsAuditConfig,
  } = await import("./hcsAudit"));
});

describe("HCS audit configuration", () => {
  it("requires an env-provided topic id", () => {
    expect(() =>
      assertHcsAuditReady({
        HEDERA_NETWORK: "testnet",
      }),
    ).toThrow(/HEDERA_HCS_TOPIC_ID/);
  });

  it("rejects non-testnet HCS audit writes", () => {
    expect(() =>
      assertHcsAuditReady({
        HEDERA_NETWORK: "mainnet",
        HEDERA_HCS_TOPIC_ID: "0.0.7001",
      }),
    ).toThrow(/testnet/);
  });

  it("accepts a testnet topic and operator config without exposing the key", () => {
    const config = readHcsAuditConfig({
      HEDERA_NETWORK: "testnet",
      HEDERA_HCS_TOPIC_ID: "0.0.7001",
      HEDERA_OPERATOR_ACCOUNT_ID: "0.0.1234",
      HEDERA_OPERATOR_PRIVATE_KEY: "secret",
      HEDERA_OPERATOR_PRIVATE_KEY_TYPE: "ECDSA",
    });

    expect(config.network).toBe("testnet");
    expect(config.topicId).toBe("0.0.7001");
    expect(config.operatorAccountId).toBe("0.0.1234");
    expect(config.operatorPrivateKeyType).toBe("ECDSA");
  });

  it("creates a bounded audit message with receipt and policy references", () => {
    const message = createHcsAuditMessage({
      schemaVersion: "pfn.guarded-commerce-hcs-audit-input.v1",
      scenarioId: "approved-hbar",
      requestId: "GCA-APPROVED-001",
      serviceName: "PFN approved data API",
      policyDecision: "approved",
      hbarTransactionId: "0.0.1234@1710000000.000000000",
      hbarReceiptStatus: "SUCCESS",
      recipientAccountId: "0.0.9186153",
      amountTinybars: "100000000",
      memo: "PFN-GCA:GCA-APPROVED-001",
      occurredAt: "2026-06-15T22:00:00.000Z",
    });

    expect(message.schemaVersion).toBe("pfn.guarded-commerce-hcs-audit.v1");
    expect(message.policyDecision).toBe("approved");
    expect(message.hbarTransactionId).toBe(
      "0.0.1234@1710000000.000000000",
    );
    expect(message.boundaries).toMatchObject({
      network: "testnet",
      currency: "HBAR",
      mainnet: false,
      usdcLiveTransfer: false,
      persistence: false,
    });
  });
});
