# PFN Guarded Commerce Agent

Standalone submission prototype for Issue #80: a policy-gated Hedera commerce agent for PFN feature-buy requests.

This is Jug-style PFN, not a clone of another agent-spend project. The demo keeps the agent boxed inside policy before any payment proof, HBAR transfer, HCS write, or PFN receipt handoff can happen.

## Core Flow

1. User chooses the Hedera rail for a PFN feature buy.
2. Agent creates a normalized PFN feature-buy request.
3. Policy checks amount, recipient, purpose, currency, daily budget, and human approval threshold.
4. The decision is allowed, blocked, or escalated.
5. HCS can record the policy decision on Hedera testnet.
6. Approved HBAR can be submitted on Hedera testnet when local server env vars explicitly enable it.
7. PFN receipt preview marks the fulfillment target as `XRP / XRPL EVM Feature NFT`.

This is cross-rail PFN fulfillment proof, not a value bridge. HBAR payment is verified on Hedera; the PFN receipt/proof is fulfillment-ready for XRP / XRPL EVM Feature NFT delivery.

## Policies

- `MaxSpendPolicy`
- `AllowedCounterpartyPolicy`
- `AllowedPurposePolicy`
- `CurrencyPolicy`
- `DailyBudgetPolicy`
- `HumanApprovalPolicy`

## Demo Scenarios

| Scenario | Expected result |
| --- | --- |
| `approved-feature-buy` | 2 HBAR to approved PFN provider for `feature-unlock`; receipt preview is fulfillment-ready. |
| `blocked-over-limit` | 20 HBAR is blocked by `MaxSpendPolicy`. |
| `blocked-unknown-recipient` | 2 HBAR to an unknown recipient is blocked by `AllowedCounterpartyPolicy`. |
| `blocked-wrong-purpose` | 2 HBAR for `unrelated-trade` is blocked by `AllowedPurposePolicy`. |
| `blocked-wrong-currency` | 2 XRP on the Hedera rail is blocked by `CurrencyPolicy`. |
| `escalated-owner-review` | 8 HBAR requires `HumanApprovalPolicy` owner review. |

## Hedera Scope

- Hedera Agent Kit is installed and used for the policy adapter boundary.
- Hedera testnet is the only network allowed.
- `POST /api/audit` can write allowed, blocked, or escalated policy decisions to HCS when testnet env vars are configured.
- `POST /api/runtime/execute-hbar` can submit approved HBAR testnet transfers and write a receipt-linked HCS checkpoint when env vars are configured.
- Blocked and escalated requests stop before Hedera client creation in the live-HBAR path.
- No mainnet, browser key collection, custody, database write, HTS/USDC transfer, or PFN core edit is present.

## Receipt Shape

```json
{
  "project": "PFN Guarded Commerce Agent",
  "rail": "hedera",
  "sourcePayment": "HBAR testnet tx or verified payment proof",
  "feature": "PFN Feature Unlock",
  "fulfillmentTarget": "XRP / XRPL EVM Feature NFT",
  "decision": "allowed",
  "policyVersion": "pfn-guarded-commerce-v1",
  "receiptId": "pfn-gca:GCA-APPROVED-FEATURE-001",
  "hcsTopicId": null,
  "hcsSequenceNumber": null,
  "status": "fulfillment-ready"
}
```

## Historical Testnet Proof

One earlier approved policy-gated Hedera testnet proof pass exists and can be shown as supporting evidence:

- HBAR transaction: `0.0.9238841@1781579286.685864540`
- HBAR recipient: `0.0.9186153`
- HBAR amount: `100000000` tinybars / 1 HBAR
- HCS transaction: `0.0.9238841@1781579288.693796185`
- HCS topic: `0.0.9248994`
- HCS sequence: `1`
- HCS message hash: `409a6e30bcb1a439d5c9da90df3a84b1a3f2be5a9f9ebba12057947f22070edd`

No extra HBAR transfer is required for UI or deployment polish. Running another live transfer requires explicit local or deployment env configuration and must stay testnet-only.

## Submission Checklist

- Public GitHub repository: `https://github.com/oldjug/pfn-guarded-commerce-agent`
- Hosted demo deployed from `master` with `.env.local` excluded.
- README explains the agent, policies, scenarios, Hedera testnet use, and boundaries.
- `.env.example` included.
- No secrets committed.
- Policy demo works locally.
- HCS audit/proof messages work on testnet when env vars are configured.
- Demo video shows approved, blocked, escalated, receipt, HCS, and no-custody boundaries.
- Hedera feedback issue link added before final form submission.

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional HBAR and HCS Testnet Execution

Copy `.env.example` to `.env.local` locally and set testnet operator values:

```bash
HEDERA_LIVE_HBAR_ENABLED=true
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ACCOUNT_ID=0.0.YOUR_OPERATOR_ACCOUNT
HEDERA_OPERATOR_PRIVATE_KEY=YOUR_OPERATOR_PRIVATE_KEY
HEDERA_OPERATOR_PRIVATE_KEY_TYPE=ECDSA
HEDERA_MAX_TRANSACTION_FEE_TINYBARS=100000000
HEDERA_HCS_TOPIC_ID=0.0.YOUR_HCS_TOPIC
```

`HEDERA_OPERATOR_PRIVATE_KEY_TYPE` may be `DER`, `ECDSA`, or `ED25519`. Do not paste keys into GitHub, Vercel, chat, screenshots, or the README.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Dependency Posture

The current Agent Kit and Hiero SDK dependency chain may report unresolved transitive `npm audit` findings. This prototype limits live network access to explicit local testnet HBAR/HCS routes after policy approval or policy-decision audit request. It does not accept user-supplied transaction bytes, persist receipts, or support mainnet.

Official references:

- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js)
- [Hedera AI and agents documentation](https://docs.hedera.com/solutions/ai)
