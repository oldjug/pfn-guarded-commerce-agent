import type {
  DemoScenario,
  GuardedCommercePolicy,
} from "./types";

export const GUARDED_COMMERCE_POLICY: GuardedCommercePolicy = {
  currencies: {
    HBAR: {
      currency: "HBAR",
      decimals: 8,
      maxSpendAtomic: "1000000000",
      dailyBudgetAtomic: "3000000000",
      humanApprovalThresholdAtomic: "500000000",
      status: "primary_demo",
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
    "feature-unlock",
  ],
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "approved-feature-buy",
    label: "Approved feature buy",
    description:
      "2 HBAR to the approved PFN provider for feature-unlock.",
    request: {
      requestId: "GCA-APPROVED-FEATURE-001",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "feature-unlock",
      currency: "HBAR",
      amountAtomic: "200000000",
      spentTodayAtomic: "200000000",
    },
  },
  {
    id: "blocked-over-limit",
    label: "Over limit",
    description: "20 HBAR exceeds MaxSpendPolicy.",
    request: {
      requestId: "GCA-LIMIT-002",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "feature-unlock",
      currency: "HBAR",
      amountAtomic: "2000000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "blocked-unknown-recipient",
    label: "Unknown recipient",
    description: "2 HBAR to a recipient outside the approved list.",
    request: {
      requestId: "GCA-RECIPIENT-003",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9999999",
      purpose: "feature-unlock",
      currency: "HBAR",
      amountAtomic: "200000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "blocked-wrong-purpose",
    label: "Wrong purpose",
    description: "2 HBAR with unrelated-trade as the purpose.",
    request: {
      requestId: "GCA-PURPOSE-004",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "unrelated-trade",
      currency: "HBAR",
      amountAtomic: "200000000",
      spentTodayAtomic: "100000000",
    },
  },
  {
    id: "blocked-wrong-currency",
    label: "Wrong currency",
    description: "2 XRP is unsupported for the Hedera rail.",
    request: {
      requestId: "GCA-CURRENCY-005",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "feature-unlock",
      currency: "XRP",
      amountAtomic: "2000000",
      spentTodayAtomic: "0",
    },
  },
  {
    id: "escalated-owner-review",
    label: "Owner review",
    description: "8 HBAR is allowed only after human approval.",
    request: {
      requestId: "GCA-ESCALATED-006",
      serviceName: "PFN Feature Unlock",
      recipientAccountId: "0.0.9186153",
      purpose: "feature-unlock",
      currency: "HBAR",
      amountAtomic: "800000000",
      spentTodayAtomic: "100000000",
    },
  },
];

export const DEFAULT_SCENARIO_ID = DEMO_SCENARIOS[0].id;

export function getDemoScenarioById(scenarioId: string) {
  return DEMO_SCENARIOS.find(({ id }) => id === scenarioId) ?? null;
}

export function getCurrencyStatus(currency: string) {
  if (currency !== "HBAR") {
    return "unsupported";
  }

  return GUARDED_COMMERCE_POLICY.currencies[currency].status;
}
