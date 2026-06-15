import type {
  DemoScenario,
  GuardedCommercePolicy,
} from "./types";

export const GUARDED_COMMERCE_POLICY: GuardedCommercePolicy = {
  currencies: {
    HBAR: {
      currency: "HBAR",
      decimals: 8,
      maxSpendAtomic: "500000000",
      dailyBudgetAtomic: "1200000000",
      status: "primary_demo",
    },
    USDC: {
      currency: "USDC",
      decimals: 6,
      maxSpendAtomic: "10000000",
      dailyBudgetAtomic: "25000000",
      status: "policy_ready",
    },
  },
  allowedCounterparties: [
    {
      accountId: "0.0.9186153",
      label: "PFN approved service receiver",
    },
    {
      accountId: "0.0.8010421",
      label: "Approved data service",
    },
  ],
  allowedPurposes: [
    "api_access",
    "commerce_unlock",
    "document_analysis",
  ],
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "approved-hbar",
    label: "Approved HBAR",
    description:
      "Allowed recipient, purpose, currency, request limit, and daily budget.",
    request: {
      requestId: "GCA-APPROVED-001",
      serviceName: "PFN document analysis API",
      recipientAccountId: "0.0.9186153",
      purpose: "document_analysis",
      currency: "HBAR",
      amountAtomic: "100000000",
      spentTodayAtomic: "200000000",
    },
  },
  {
    id: "over-limit",
    label: "Over limit",
    description: "The request exceeds MaxSpendPolicy and is blocked.",
    request: {
      requestId: "GCA-LIMIT-002",
      serviceName: "PFN commerce unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "commerce_unlock",
      currency: "HBAR",
      amountAtomic: "600000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "unknown-recipient",
    label: "Unknown recipient",
    description: "The recipient is absent from the approved counterparty list.",
    request: {
      requestId: "GCA-RECIPIENT-003",
      serviceName: "Unknown API provider",
      recipientAccountId: "0.0.9999999",
      purpose: "api_access",
      currency: "HBAR",
      amountAtomic: "50000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "wrong-purpose",
    label: "Wrong purpose",
    description: "The requested purpose is outside the approved use cases.",
    request: {
      requestId: "GCA-PURPOSE-004",
      serviceName: "Unapproved trading service",
      recipientAccountId: "0.0.8010421",
      purpose: "speculative_trading",
      currency: "HBAR",
      amountAtomic: "50000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "usdc-policy-preview",
    label: "USDC policy preview",
    description:
      "USDC passes the policy model, but token transfer execution is not implemented.",
    request: {
      requestId: "GCA-USDC-005",
      serviceName: "PFN approved data API",
      recipientAccountId: "0.0.8010421",
      purpose: "api_access",
      currency: "USDC",
      amountAtomic: "3000000",
      spentTodayAtomic: "4000000",
    },
  },
];

export const DEFAULT_SCENARIO_ID = DEMO_SCENARIOS[0].id;

export function getCurrencyStatus(currency: string) {
  if (currency !== "HBAR" && currency !== "USDC") {
    return "unsupported";
  }

  return GUARDED_COMMERCE_POLICY.currencies[currency].status;
}
