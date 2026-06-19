import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import { coreAccountPluginToolNames } from "@hashgraph/hedera-agent-kit/plugins";

import type { NormalizedCommerceIntent } from "@/lib/agent-runtime/types";
import type {
  PolicyCheck,
  PolicyCheckKey,
  PolicyEvaluation,
} from "@/lib/policy/types";

export const PFN_UNSUPPORTED_CURRENCY_POLICY_PREVIEW_TOOL =
  "pfn_unsupported_currency_policy_preview_tool";

export const GUARDED_COMMERCE_RELEVANT_TOOLS = [
  coreAccountPluginToolNames.TRANSFER_HBAR_TOOL,
  PFN_UNSUPPORTED_CURRENCY_POLICY_PREVIEW_TOOL,
] as const;

type RuntimeNormalisedParams = {
  intent: NormalizedCommerceIntent;
  evaluation: PolicyEvaluation;
};

export class GuardedCommercePolicyAdapter extends AbstractPolicy {
  readonly relevantTools = [...GUARDED_COMMERCE_RELEVANT_TOOLS];

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly checkKey: PolicyCheckKey,
  ) {
    super();
  }

  readCheck(evaluation: PolicyEvaluation): PolicyCheck {
    const check = evaluation.checks.find(({ key }) => key === this.checkKey);

    if (!check) {
      throw new Error(`Missing runtime policy check: ${this.checkKey}`);
    }

    return check;
  }

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams<
      unknown,
      RuntimeNormalisedParams
    >,
  ): boolean {
    return !this.readCheck(params.normalisedParams.evaluation).passed;
  }
}

export function createGuardedCommercePolicyAdapters() {
  return [
    new GuardedCommercePolicyAdapter(
      "MaxSpendPolicy",
      "Blocks requests above the configured per-request spend limit.",
      "max_spend",
    ),
    new GuardedCommercePolicyAdapter(
      "AllowedCounterpartyPolicy",
      "Blocks recipients outside the approved Hedera counterparty list.",
      "allowed_counterparty",
    ),
    new GuardedCommercePolicyAdapter(
      "AllowedPurposePolicy",
      "Blocks service purposes outside the approved commerce use cases.",
      "allowed_purpose",
    ),
    new GuardedCommercePolicyAdapter(
      "CurrencyPolicy",
      "Allows only currencies explicitly configured for the runtime.",
      "currency",
    ),
    new GuardedCommercePolicyAdapter(
      "DailyBudgetPolicy",
      "Blocks requests that would exceed the configured daily budget.",
      "daily_budget",
    ),
    new GuardedCommercePolicyAdapter(
      "HumanApprovalPolicy",
      "Escalates higher-value requests for owner review before any spend.",
      "human_approval",
    ),
  ] as const;
}
