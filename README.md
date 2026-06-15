# PFN Guarded Commerce Agent

Standalone Phase 1 prototype for Issue #80: a policy-gated commerce agent that evaluates a proposed Hedera service purchase before any wallet or network action is allowed.

## Phase 1 scope

The demo evaluates five runtime policies:

- `MaxSpendPolicy`
- `AllowedCounterpartyPolicy`
- `AllowedPurposePolicy`
- `CurrencyPolicy`
- `DailyBudgetPolicy`

The dashboard includes one approved HBAR request, three blocked requests, and a USDC policy-only preview. Every evaluation produces a local mock proof trail.

## Truth and boundaries

- HBAR is the primary demo currency.
- USDC is represented at the policy layer only.
- No Hedera SDK, RPC call, wallet signing, or transaction submission is present.
- No private key, seed, custody path, `.env` file, database write, or HCS submission is present.
- A `mock_policy_receipt_created` result is a local audit preview, not a Hedera ledger receipt.
- This repository is standalone and does not modify PFN core.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
