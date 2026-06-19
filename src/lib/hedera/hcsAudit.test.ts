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
      scenarioId: "escalated-owner-review",
      requestId: "GCA-ESCALATED-006",
      serviceName: "PFN Feature Unlock",
      policyDecision: "escalated",
      policyVersion: "pfn-guarded-commerce-v1",
      receiptId: "pfn-gca:GCA-ESCALATED-006",
      receiptStatus: "owner-review-required",
      feature: "PFN Feature Unlock",
      fulfillmentTarget: "XRP / XRPL EVM Feature NFT",
      hbarTransactionId: null,
      hbarReceiptStatus: null,
      recipientAccountId: "0.0.9186153",
      amountAtomic: "800000000",
      currency: "HBAR",
      memo: "PFN-GCA:GCA-ESCALATED-006",
      blockedBy: [],
      escalatedBy: ["human_approval"],
      occurredAt: "2026-06-15T22:00:00.000Z",
    });

    expect(message.schemaVersion).toBe("pfn.guarded-commerce-hcs-audit.v1");
    expect(message.policyDecision).toBe("escalated");
    expect(message.hbarTransactionId).toBeNull();
    expect(message.fulfillmentTarget).toBe("XRP / XRPL EVM Feature NFT");
    expect(message.escalatedBy).toEqual(["human_approval"]);
    expect(message.boundaries).toMatchObject({
      network: "testnet",
      currency: "HBAR",
      mainnet: false,
      usdcLiveTransfer: false,
      persistence: false,
    });
  });
});
