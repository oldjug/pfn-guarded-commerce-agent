import type {
  CommerceRequest,
  GuardedCommercePolicy,
  PolicyCheck,
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
  if (currency !== "HBAR" && currency !== "USDC") {
    return null;
  }

  return policy.currencies[currency];
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
    {
      key: "max_spend",
      label: "MaxSpendPolicy",
      passed:
        amount !== null &&
        maxSpend !== null &&
        amount > BigInt(0) &&
        amount <= maxSpend,
      expected: currencyPolicy
        ? `At most ${formatAtomicAmount(
            currencyPolicy.maxSpendAtomic,
            currencyPolicy.decimals,
            request.currency,
          )} per request`
        : "A configured currency limit",
      observed: amountLabel,
    },
    {
      key: "allowed_counterparty",
      label: "AllowedCounterpartyPolicy",
      passed: policy.allowedCounterparties.some(
        ({ accountId }) => accountId === request.recipientAccountId,
      ),
      expected: policy.allowedCounterparties
        .map(({ accountId }) => accountId)
        .join(", "),
      observed: request.recipientAccountId,
    },
    {
      key: "allowed_purpose",
      label: "AllowedPurposePolicy",
      passed: policy.allowedPurposes.includes(request.purpose),
      expected: policy.allowedPurposes.join(", "),
      observed: request.purpose,
    },
    {
      key: "currency",
      label: "CurrencyPolicy",
      passed: currencyPolicy !== null,
      expected: Object.keys(policy.currencies).join(", "),
      observed: request.currency,
    },
    {
      key: "daily_budget",
      label: "DailyBudgetPolicy",
      passed:
        amount !== null &&
        spentToday !== null &&
        dailyBudget !== null &&
        amount > BigInt(0) &&
        spentToday + amount <= dailyBudget,
      expected: currencyPolicy
        ? `Daily total at or below ${formatAtomicAmount(
            currencyPolicy.dailyBudgetAtomic,
            currencyPolicy.decimals,
            request.currency,
          )}`
        : "A configured daily budget",
      observed:
        amount !== null && spentToday !== null && currencyPolicy
          ? `${spentTodayLabel} spent + ${amountLabel} requested`
          : "Invalid or unsupported amount",
    },
  ];
  const blockedBy = checks
    .filter(({ passed }) => !passed)
    .map(({ key }) => key);

  return {
    decision: blockedBy.length === 0 ? "approved" : "blocked",
    request,
    checks,
    blockedBy,
  };
}
