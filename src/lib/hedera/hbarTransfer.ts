import "server-only";

import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TransferTransaction,
} from "@hiero-ledger/sdk";

import type {
  HbarTransferExecutionInput,
  HbarTransferReceipt,
} from "@/lib/agent-runtime/types";

type EnvSource = Record<string, string | undefined>;

export type HederaTestnetConfig = {
  enabled: true;
  network: "testnet";
  operatorAccountId: string;
  operatorPrivateKey: string;
  operatorPrivateKeyType: "DER" | "ECDSA" | "ED25519";
  maxTransactionFeeTinybars: string;
};

export class HbarTransferConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HbarTransferConfigurationError";
  }
}

const ACCOUNT_ID_PATTERN = /^\d+\.\d+\.\d+$/;
const TINYBAR_PATTERN = /^(0|[1-9]\d*)$/;

function requireEnv(env: EnvSource, key: string) {
  const value = env[key]?.trim();
  if (!value) {
    throw new HbarTransferConfigurationError(`Missing ${key}.`);
  }

  return value;
}

function normalizeKeyType(value: string | undefined) {
  const keyType = (value ?? "DER").trim().toUpperCase();
  if (keyType !== "DER" && keyType !== "ECDSA" && keyType !== "ED25519") {
    throw new HbarTransferConfigurationError(
      "HEDERA_OPERATOR_PRIVATE_KEY_TYPE must be DER, ECDSA, or ED25519.",
    );
  }

  return keyType;
}

function assertTinybars(value: string, label: string) {
  if (!TINYBAR_PATTERN.test(value) || BigInt(value) <= BigInt(0)) {
    throw new HbarTransferConfigurationError(`${label} must be positive tinybars.`);
  }
}

export function readHederaTestnetConfig(
  env: EnvSource = process.env,
): HederaTestnetConfig {
  if (env.HEDERA_LIVE_HBAR_ENABLED !== "true") {
    throw new HbarTransferConfigurationError(
      "Live HBAR execution is disabled. Set HEDERA_LIVE_HBAR_ENABLED=true locally.",
    );
  }

  const network = requireEnv(env, "HEDERA_NETWORK").toLowerCase();
  if (network !== "testnet") {
    throw new HbarTransferConfigurationError(
      "Only HEDERA_NETWORK=testnet is allowed in Phase 3.",
    );
  }

  const operatorAccountId = requireEnv(env, "HEDERA_OPERATOR_ACCOUNT_ID");
  if (!ACCOUNT_ID_PATTERN.test(operatorAccountId)) {
    throw new HbarTransferConfigurationError(
      "HEDERA_OPERATOR_ACCOUNT_ID must look like 0.0.x.",
    );
  }

  const maxTransactionFeeTinybars =
    env.HEDERA_MAX_TRANSACTION_FEE_TINYBARS?.trim() || "100000000";
  assertTinybars(maxTransactionFeeTinybars, "HEDERA_MAX_TRANSACTION_FEE_TINYBARS");

  return {
    enabled: true,
    network: "testnet",
    operatorAccountId,
    operatorPrivateKey: requireEnv(env, "HEDERA_OPERATOR_PRIVATE_KEY"),
    operatorPrivateKeyType: normalizeKeyType(
      env.HEDERA_OPERATOR_PRIVATE_KEY_TYPE,
    ),
    maxTransactionFeeTinybars,
  };
}

function parsePrivateKey(config: HederaTestnetConfig) {
  switch (config.operatorPrivateKeyType) {
    case "ECDSA":
      return PrivateKey.fromStringECDSA(config.operatorPrivateKey);
    case "ED25519":
      return PrivateKey.fromStringED25519(config.operatorPrivateKey);
    case "DER":
      return PrivateKey.fromStringDer(config.operatorPrivateKey);
  }
}

function assertTransferInput(input: HbarTransferExecutionInput) {
  if (!ACCOUNT_ID_PATTERN.test(input.recipientAccountId)) {
    throw new HbarTransferConfigurationError(
      "Recipient account must look like 0.0.x.",
    );
  }

  assertTinybars(input.amountTinybars, "Transfer amount");

  if (!input.memo || input.memo.length > 100) {
    throw new HbarTransferConfigurationError(
      "Transaction memo is required and must be 100 characters or fewer.",
    );
  }
}

export async function executeTestnetHbarTransfer(
  input: HbarTransferExecutionInput,
  env: EnvSource = process.env,
): Promise<HbarTransferReceipt> {
  assertTransferInput(input);
  const config = readHederaTestnetConfig(env);
  const operatorAccountId = AccountId.fromString(config.operatorAccountId);
  const operatorPrivateKey = parsePrivateKey(config);
  const recipientAccountId = AccountId.fromString(input.recipientAccountId);
  const client = Client.forTestnet();

  try {
    client.setOperator(operatorAccountId, operatorPrivateKey);
    client.setDefaultMaxTransactionFee(
      Hbar.fromTinybars(config.maxTransactionFeeTinybars),
    );

    const response = await new TransferTransaction()
      .addHbarTransfer(
        operatorAccountId,
        Hbar.fromTinybars(input.amountTinybars).negated(),
      )
      .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(input.amountTinybars))
      .setTransactionMemo(input.memo)
      .execute(client);
    const receipt = await response.getReceipt(client);

    return {
      network: "testnet",
      transactionId: response.transactionId.toString(),
      nodeId: response.nodeId.toString(),
      transactionHash: Buffer.from(response.transactionHash).toString("hex"),
      receiptStatus: receipt.status.toString(),
      recipientAccountId: input.recipientAccountId,
      amountTinybars: input.amountTinybars,
      memo: input.memo,
      executedAt: new Date().toISOString(),
    };
  } finally {
    client.close();
  }
}
