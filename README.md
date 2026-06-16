# PFN Guarded Commerce Agent

Standalone submission prototype for Issue #80: a policy-gated commerce agent that evaluates a proposed Hedera service purchase before any wallet or network action is allowed, then can submit a real HBAR transfer on Hedera testnet and write an HCS audit checkpoint only after the policies approve it.

## Submission scope

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
6. preflight a local HCS testnet topic for approved HBAR requests,
7. submit an HBAR testnet transfer only for approved HBAR requests when local server env vars explicitly enable it,
8. write an HCS audit checkpoint with the policy decision and HBAR receipt reference.

The dashboard includes one approved HBAR request, three blocked requests, and a USDC policy-only preview. Every evaluation produces a visible lifecycle and local mock proof trail. The approved HBAR request can trigger a live testnet transfer when server env vars are configured locally or in a controlled testnet deployment.

## Truth and boundaries

- HBAR is the primary demo currency.
- USDC is represented at the policy layer only and remains preview-only for submission.
- Hedera Agent Kit and its required SDK peer are installed for runtime contract integration.
- `AgentMode.RETURN_BYTES` is recorded as the future external-signing posture, but Phase 5 server execution uses an environment-backed testnet operator for HBAR plus HCS audit only.
- Blocked requests stop before Hedera client creation.
- No mainnet, USDC live transfer, browser key collection, database write, or PFN core edit is present.
- HCS writes are limited to approved HBAR audit checkpoints and require `HEDERA_HCS_TOPIC_ID` from local env.
- No private key, seed, or `.env` file is committed.
- A `mock_policy_receipt_created` result is a local audit preview, not a Hedera ledger receipt.
- This repository is standalone and does not modify PFN core.

## Live proof lock

The submission proof path is HBAR plus HCS. USDC stays policy-supported and preview-only unless a later bounty requirement explicitly asks for live token transfer support.

Phase 5B completed one approved policy-gated Hedera testnet proof pass:

- HBAR transaction: `0.0.9238841@1781579286.685864540`
- HBAR recipient: `0.0.9186153`
- HBAR amount: `100000000` tinybars / 1 HBAR
- HBAR memo: `PFN-GCA:GCA-APPROVED-001`
- HCS transaction: `0.0.9238841@1781579288.693796185`
- HCS topic: `0.0.9248994`
- HCS sequence: `1`
- HCS message hash: `409a6e30bcb1a439d5c9da90df3a84b1a3f2be5a9f9ebba12057947f22070edd`

No extra HBAR transfer is required for deployment polish. The hosted demo can show the policy engine, blocked flows, USDC preview-only path, and the server-gated HBAR/HCS execution boundary. Running another live transfer requires explicit local or deployment env configuration and should stay testnet-only.

## Submission checklist

- GitHub repository: `https://github.com/oldjug/pfn-guarded-commerce-agent`
- Hosted demo: deploy from `master` with `.env.local` excluded.
- Demo proof: show the approved HBAR scenario, policy lifecycle, HBAR receipt, and HCS audit checkpoint.
- Blocked proof: show an over-limit, unknown-recipient, or wrong-purpose scenario stopping before Hedera client creation.
- USDC note: policy-supported preview only; no live USDC transfer in this submission.
- Boundary note: no mainnet, no custody, no browser key collection, no persistence/database writes, and no PFN core edits.

## Agent Kit integration

- Core package: `@hashgraph/hedera-agent-kit@4.0.0`
- SDK peer: `@hiero-ledger/sdk@2.81.0`
- HBAR tool identity: `transfer_hbar_tool`
- Policy lifecycle phase: `post_params_normalization`
- Runtime API: `POST /api/runtime/evaluate`
- Live HBAR + HCS API: `POST /api/runtime/execute-hbar`
- Execution boundary: policy-gated Hedera testnet HBAR plus HCS audit checkpoint only

## Dependency posture

The current Agent Kit and Hiero SDK dependency chain reports unresolved
transitive `npm audit` findings, including protobuf and gRPC advisories without
available upstream fixes. Phase 5 limits live network access to an explicit
local testnet HBAR execution route after policy approval and a local-env HCS
topic checkpoint. It does not accept user-supplied transaction bytes, persist
receipts, or support mainnet. This prototype must not be described as
production-ready until those dependencies and the runtime threat model are
reviewed again.

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
HEDERA_HCS_TOPIC_ID=0.0.YOUR_HCS_TOPIC
```

`HEDERA_OPERATOR_PRIVATE_KEY_TYPE` may be `DER`, `ECDSA`, or `ED25519`.
Only `HEDERA_NETWORK=testnet` is accepted. `HEDERA_HCS_TOPIC_ID` must be a
testnet topic that the configured operator can submit messages to. Do not paste
keys into GitHub, Vercel, chat, screenshots, or the README.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
