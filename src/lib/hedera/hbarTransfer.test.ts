import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let readHederaTestnetConfig: typeof import("./hbarTransfer").readHederaTestnetConfig;

beforeAll(async () => {
  ({ readHederaTestnetConfig } = await import("./hbarTransfer"));
});

describe("readHederaTestnetConfig", () => {
  it("requires explicit live HBAR enablement", () => {
    expect(() => readHederaTestnetConfig({})).toThrow(
      /HEDERA_LIVE_HBAR_ENABLED=true/,
    );
  });

  it("rejects non-testnet network values", () => {
    expect(() =>
      readHederaTestnetConfig({
        HEDERA_LIVE_HBAR_ENABLED: "true",
        HEDERA_NETWORK: "mainnet",
        HEDERA_OPERATOR_ACCOUNT_ID: "0.0.1234",
        HEDERA_OPERATOR_PRIVATE_KEY: "secret",
      }),
    ).toThrow(/Only HEDERA_NETWORK=testnet/);
  });

  it("accepts a testnet-only config without exposing the key", () => {
    const config = readHederaTestnetConfig({
      HEDERA_LIVE_HBAR_ENABLED: "true",
      HEDERA_NETWORK: "testnet",
      HEDERA_OPERATOR_ACCOUNT_ID: "0.0.1234",
      HEDERA_OPERATOR_PRIVATE_KEY: "secret",
      HEDERA_OPERATOR_PRIVATE_KEY_TYPE: "ECDSA",
    });

    expect(config.network).toBe("testnet");
    expect(config.operatorAccountId).toBe("0.0.1234");
    expect(config.operatorPrivateKeyType).toBe("ECDSA");
    expect(config.maxTransactionFeeTinybars).toBe("100000000");
  });
});
