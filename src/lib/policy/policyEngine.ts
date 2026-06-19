import type {
  CommerceRequest,
  GuardedCommercePolicy,
  PolicyCheck,
  PolicyCheckResult,
  PolicyEvaluation,
} from "./types";

const ATOMIC_AMOUNT_PATTERN = /^(0|[1-9]\d*)$/;

function parseAtomicAmount(value: string) {
  if (!ATOMIC_AMOUNT_PATTERN.test(value)) {
    return null;
  }

  return BigInt(value);
}

export function formatAtomicAmount(
  atomicValue: string,
  decimals: number,
  currency: string,
) {
  const value = parseAtomicAmount(atomicValue);
  if (value === null) {
    return `invalid ${currency} amount`;
  }

  const base = BigInt(10) ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}${fraction ? `.${fraction}` : ""} ${currency}`;
}

function resolveCurrencyPolicy(
  policy: GuardedCommercePolicy,
  currency: string,
) {
  if (currency !== "HBAR") {
    return null;
  }

  return policy.currencies[currency];
}

function check(
  input: Omit<PolicyCheck, "passed">,
): PolicyCheck {
  return {
    ...input,
    passed: input.result === "pass",
  };
}

function humanApprovalResult(args: {
  amount: bigint | null;
  maxSpend: bigint | null;
  humanApprovalThreshold: bigint | null;
  hasCurrencyPolicy: boolean;
}): PolicyCheckResult {
  if (
    !args.hasCurrencyPolicy ||
    args.amount === null ||
    args.maxSpend === null ||
    args.humanApprovalThreshold === null ||
    args.amount <= BigInt(0)
  ) {
    return "pass";
  }

  if (
    args.amount > args.humanApprovalThreshold &&
    args.amount <= args.maxSpend
  ) {
    return "escalate";
  }

  return "pass";
}

export function evaluateCommerceRequest(
  policy: GuardedCommercePolicy,
  request: CommerceRequest,
): PolicyEvaluation {
  const currencyPolicy = resolveCurrencyPolicy(policy, request.currency);
  const amount = parseAtomicAmount(request.amountAtomic);
  const spentToday = parseAtomicAmount(request.spentTodayAtomic);
  const maxSpend = currencyPolicy
    ? parseAtomicAmount(currencyPolicy.maxSpendAtomic)
    : null;
  const dailyBudget = currencyPolicy
    ? parseAtomicAmount(currencyPolicy.dailyBudgetAtomic)
    : null;
  const humanApprovalThreshold = currencyPolicy
    ? parseAtomicAmount(currencyPolicy.humanApprovalThresholdAtomic)
    : null;
  const amountLabel = currencyPolicy
    ? formatAtomicAmount(
        request.amountAtomic,
        currencyPolicy.decimals,
        request.currency,
      )
    : request.amountAtomic;
  const spentTodayLabel = currencyPolicy
    ? formatAtomicAmount(
        request.spentTodayAtomic,
        currencyPolicy.decimals,
        request.currency,
      )
    : request.spentTodayAtomic;

  const checks: PolicyCheck[] = [
    check({
      key: "max_spend",
      label: "MaxSpendPolicy",
      result:
        currencyPolicy === null
          ? "pass"
          : amount !== null &&
              maxSpend !== null &&
              amount > BigInt(0) &&
              amount <= maxSpend
            ? "pass"
            : "block",
      expected: currencyPolicy
        ? `At most ${formatAtomicAmount(
            currencyPolicy.maxSpendAtomic,
            currencyPolicy.decimals,
            request.currency,
          )} per request`
        : "CurrencyPolicy must accept the currency before spend limits apply",
      observed: amountLabel,
    }),
    check({
      key: "allowed_counterparty",
      label: "AllowedCounterpartyPolicy",
      result: policy.allowedCounterparties.some(
        ({ accountId }) => accountId === request.recipientAccountId,
      )
        ? "pass"
        : "block",
      expected: policy.allowedCounterparties
        .map(({ accountId }) => accountId)
        .join(", "),
      observed: request.recipientAccountId,
    }),
    check({
      key: "allowed_purpose",
      label: "AllowedPurposePolicy",
      result: policy.allowedPurposes.includes(request.purpose)
        ? "pass"
        : "block",
      expected: policy.allowedPurposes.join(", "),
      observed: request.purpose,
    }),
    check({
      key: "currency",
      label: "CurrencyPolicy",
      result: currencyPolicy !== null ? "pass" : "block",
      expected: "HBAR on the Hedera rail",
      observed: request.currency,
    }),
    check({
      key: "daily_budget",
      label: "DailyBudgetPolicy",
      result:
        currencyPolicy === null
          ? "pass"
          : amount !== null &&
              spentToday !== null &&
              dailyBudget !== null &&
              amount > BigInt(0) &&
              spentToday + amount <= dailyBudget
            ? "pass"
            : "block",
      expected: currencyPolicy
        ? `Daily total at or below ${formatAtomicAmount(
            currencyPolicy.dailyBudgetAtomic,
            currencyPolicy.decimals,
            request.currency,
          )}`
        : "CurrencyPolicy must accept the currency before daily budget applies",
      observed:
        amount !== null && spentToday !== null && currencyPolicy
          ? `${spentTodayLabel} spent + ${amountLabel} requested`
          : "Invalid or unsupported amount",
    }),
    check({
      key: "human_approval",
      label: "HumanApprovalPolicy",
      result: humanApprovalResult({
        amount,
        maxSpend,
        humanApprovalThreshold,
        hasCurrencyPolicy: currencyPolicy !== null,
      }),
      expected: currencyPolicy
        ? `Owner review above ${formatAtomicAmount(
            currencyPolicy.humanApprovalThresholdAtomic,
            currencyPolicy.decimals,
            request.currency,
          )} and at or below policy max`
        : "CurrencyPolicy must accept the currency before owner review applies",
      observed: amountLabel,
    }),
  ];
  const blockedBy = checks
    .filter(({ result }) => result === "block")
    .map(({ key }) => key);
  const escalatedBy = checks
    .filter(({ result }) => result === "escalate")
    .map(({ key }) => key);

  return {
    decision:
      blockedBy.length > 0
        ? "blocked"
        : escalatedBy.length > 0
          ? "escalated"
          : "approved",
    request,
    checks,
    blockedBy,
    escalatedBy,
  };
}
