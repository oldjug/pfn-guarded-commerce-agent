import "server-only";

import { createHash } from "crypto";

import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";

import type {
  HcsAuditCheckpointInput,
  HcsAuditReceipt,
} from "@/lib/agent-runtime/types";

type EnvSource = Record<string, string | undefined>;

type HcsAuditConfig = {
  network: "testnet";
  topicId: string;
  operatorAccountId: string;
  operatorPrivateKey: string;
  operatorPrivateKeyType: "DER" | "ECDSA" | "ED25519";
  maxTransactionFeeTinybars: string;
};

export class HcsAuditConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HcsAuditConfigurationError";
  }
}

const ACCOUNT_ID_PATTERN = /^\d+\.\d+\.\d+$/;
const TINYBAR_PATTERN = /^(0|[1-9]\d*)$/;
const MAX_AUDIT_MESSAGE_BYTES = 4096;

function requireEnv(env: EnvSource, key: string) {
  const value = env[key]?.trim();
  if (!value) {
    throw new HcsAuditConfigurationError(`Missing ${key}.`);
  }

  return value;
}

function normalizeKeyType(value: string | undefined) {
  const keyType = (value ?? "DER").trim().toUpperCase();
  if (keyType !== "DER" && keyType !== "ECDSA" && keyType !== "ED25519") {
    throw new HcsAuditConfigurationError(
      "HEDERA_OPERATOR_PRIVATE_KEY_TYPE must be DER, ECDSA, or ED25519.",
    );
  }

  return keyType;
}

function assertTinybars(value: string, label: string) {
  if (!TINYBAR_PATTERN.test(value) || BigInt(value) <= BigInt(0)) {
    throw new HcsAuditConfigurationError(`${label} must be positive tinybars.`);
  }
}

export function assertHcsAuditReady(env: EnvSource = process.env) {
  const network = requireEnv(env, "HEDERA_NETWORK").toLowerCase();
  if (network !== "testnet") {
    throw new HcsAuditConfigurationError(
      "Only HEDERA_NETWORK=testnet is allowed for HCS audit checkpoints.",
    );
  }

  const topicId = requireEnv(env, "HEDERA_HCS_TOPIC_ID");
  if (!ACCOUNT_ID_PATTERN.test(topicId)) {
    throw new HcsAuditConfigurationError(
      "HEDERA_HCS_TOPIC_ID must look like 0.0.x.",
    );
  }

  return {
    network: "testnet" as const,
    topicId,
  };
}

export function readHcsAuditConfig(
  env: EnvSource = process.env,
): HcsAuditConfig {
  const base = assertHcsAuditReady(env);
  const operatorAccountId = requireEnv(env, "HEDERA_OPERATOR_ACCOUNT_ID");
  if (!ACCOUNT_ID_PATTERN.test(operatorAccountId)) {
    throw new HcsAuditConfigurationError(
      "HEDERA_OPERATOR_ACCOUNT_ID must look like 0.0.x.",
    );
  }

  const maxTransactionFeeTinybars =
    env.HEDERA_MAX_TRANSACTION_FEE_TINYBARS?.trim() || "100000000";
  assertTinybars(maxTransactionFeeTinybars, "HEDERA_MAX_TRANSACTION_FEE_TINYBARS");

  return {
    ...base,
    operatorAccountId,
    operatorPrivateKey: requireEnv(env, "HEDERA_OPERATOR_PRIVATE_KEY"),
    operatorPrivateKeyType: normalizeKeyType(
      env.HEDERA_OPERATOR_PRIVATE_KEY_TYPE,
    ),
    maxTransactionFeeTinybars,
  };
}

function parsePrivateKey(config: HcsAuditConfig) {
  switch (config.operatorPrivateKeyType) {
    case "ECDSA":
      return PrivateKey.fromStringECDSA(config.operatorPrivateKey);
    case "ED25519":
      return PrivateKey.fromStringED25519(config.operatorPrivateKey);
    case "DER":
      return PrivateKey.fromStringDer(config.operatorPrivateKey);
  }
}

export function createHcsAuditMessage(input: HcsAuditCheckpointInput) {
  return {
    schemaVersion: "pfn.guarded-commerce-hcs-audit.v1",
    agent: "PFN Guarded Commerce Agent",
    phase: "issue-80-phase-5",
    scenarioId: input.scenarioId,
    requestId: input.requestId,
    serviceName: input.serviceName,
    policyDecision: input.policyDecision,
    hbarTransactionId: input.hbarTransactionId,
    hbarReceiptStatus: input.hbarReceiptStatus,
    recipientAccountId: input.recipientAccountId,
    amountTinybars: input.amountTinybars,
    memo: input.memo,
    occurredAt: input.occurredAt,
    boundaries: {
      network: "testnet",
      currency: "HBAR",
      mainnet: false,
      usdcLiveTransfer: false,
      persistence: false,
      pfnMainEdit: false,
    },
  };
}

function stableAuditMessageString(input: HcsAuditCheckpointInput) {
  return JSON.stringify(createHcsAuditMessage(input));
}

function auditMessageHash(message: string) {
  return createHash("sha256").update(message, "utf8").digest("hex");
}

export async function submitHcsAuditCheckpoint(
  input: HcsAuditCheckpointInput,
  env: EnvSource = process.env,
): Promise<HcsAuditReceipt> {
  const config = readHcsAuditConfig(env);
  const message = stableAuditMessageString(input);
  const messageBytes = Buffer.byteLength(message, "utf8");
  if (messageBytes > MAX_AUDIT_MESSAGE_BYTES) {
    throw new HcsAuditConfigurationError(
      `HCS audit message must be ${MAX_AUDIT_MESSAGE_BYTES} bytes or fewer.`,
    );
  }

  const operatorAccountId = AccountId.fromString(config.operatorAccountId);
  const operatorPrivateKey = parsePrivateKey(config);
  const topicId = TopicId.fromString(config.topicId);
  const client = Client.forTestnet();

  try {
    client.setOperator(operatorAccountId, operatorPrivateKey);
    client.setDefaultMaxTransactionFee(
      Hbar.fromTinybars(config.maxTransactionFeeTinybars),
    );

    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(client);
    const receipt = await response.getReceipt(client);

    return {
      network: "testnet",
      topicId: config.topicId,
      transactionId: response.transactionId.toString(),
      nodeId: response.nodeId.toString(),
      transactionHash: Buffer.from(response.transactionHash).toString("hex"),
      receiptStatus: receipt.status.toString(),
      topicSequenceNumber: receipt.topicSequenceNumber?.toString() ?? null,
      topicRunningHash: receipt.topicRunningHash
        ? Buffer.from(receipt.topicRunningHash).toString("hex")
        : null,
      messageHash: auditMessageHash(message),
      submittedAt: new Date().toISOString(),
    };
  } finally {
    client.close();
  }
}
