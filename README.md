# PFN Guarded Commerce Agent

Standalone Phase 3 prototype for Issue #80: a policy-gated commerce agent that evaluates a proposed Hedera service purchase before any wallet or network action is allowed, then can submit a real HBAR transfer on Hedera testnet only after the policies approve it.

## Phase 3 scope

The demo evaluates five runtime policies:

- `MaxSpendPolicy`
- `AllowedCounterpartyPolicy`
- `AllowedPurposePolicy`
- `CurrencyPolicy`
- `DailyBudgetPolicy`

The server-side runtime shell uses Hedera Agent Kit v4 contracts to:

1. receive a demo service request,
2. normalize the intended action,
3. register the five policy adapters,
4. evaluate the policy decision,
5. reach an execution boundary when approved, or stop before it when blocked.
6. submit an HBAR testnet transfer only for approved HBAR requests when local server env vars explicitly enable it.

The dashboard includes one approved HBAR request, three blocked requests, and a USDC policy-only preview. Every evaluation produces a visible lifecycle and local mock proof trail. The approved HBAR request can trigger a live testnet transfer when `.env.local` is configured locally.

## Truth and boundaries

- HBAR is the primary demo currency.
- USDC is represented at the policy layer only.
- Hedera Agent Kit and its required SDK peer are installed for runtime contract integration.
- `AgentMode.RETURN_BYTES` is recorded as the future external-signing posture, but Phase 3 server execution uses an environment-backed testnet operator for HBAR only.
- Blocked requests stop before Hedera client creation.
- No mainnet, USDC live transfer, HCS submission, browser key collection, database write, deployment, or PFN core edit is present.
- No private key, seed, or `.env` file is committed.
- A `mock_policy_receipt_created` result is a local audit preview, not a Hedera ledger receipt.
- This repository is standalone and does not modify PFN core.

## Agent Kit integration

- Core package: `@hashgraph/hedera-agent-kit@4.0.0`
- SDK peer: `@hiero-ledger/sdk@2.81.0`
- HBAR tool identity: `transfer_hbar_tool`
- Policy lifecycle phase: `post_params_normalization`
- Runtime API: `POST /api/runtime/evaluate`
- Live HBAR API: `POST /api/runtime/execute-hbar`
- Execution boundary: policy-gated Hedera testnet HBAR only

## Dependency posture

The current Agent Kit and Hiero SDK dependency chain reports unresolved
transitive `npm audit` findings, including protobuf and gRPC advisories without
available upstream fixes. Phase 3 limits live network access to an explicit
local testnet HBAR execution route after policy approval. It does not accept
user-supplied transaction bytes, write HCS, persist receipts, or support
mainnet. This prototype must not be described as production-ready until those
dependencies and the runtime threat model are reviewed again.

Official references:

- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js)
- [Hedera AI and agents documentation](https://docs.hedera.com/solutions/ai)

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional HBAR testnet execution

Copy `.env.example` to `.env.local` and set local testnet operator values:

```bash
HEDERA_LIVE_HBAR_ENABLED=true
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ACCOUNT_ID=0.0.YOUR_OPERATOR_ACCOUNT
HEDERA_OPERATOR_PRIVATE_KEY=YOUR_OPERATOR_PRIVATE_KEY
HEDERA_OPERATOR_PRIVATE_KEY_TYPE=ECDSA
HEDERA_MAX_TRANSACTION_FEE_TINYBARS=100000000
```

`HEDERA_OPERATOR_PRIVATE_KEY_TYPE` may be `DER`, `ECDSA`, or `ED25519`.
Only `HEDERA_NETWORK=testnet` is accepted. Do not paste keys into GitHub,
Vercel, chat, screenshots, or the README.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
