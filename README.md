# PFN Guarded Commerce Agent

Standalone Phase 2 prototype for Issue #80: a policy-gated commerce agent that evaluates a proposed Hedera service purchase before any wallet or network action is allowed.

## Phase 2 scope

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
5. reach a dry-run execution boundary when approved, or stop before it when blocked.

The dashboard includes one approved HBAR request, three blocked requests, and a USDC policy-only preview. Every evaluation produces a visible lifecycle and local mock proof trail.

## Truth and boundaries

- HBAR is the primary demo currency.
- USDC is represented at the policy layer only.
- Hedera Agent Kit and its required SDK peer are installed for runtime contract integration.
- `AgentMode.RETURN_BYTES` is recorded as the future external-signing posture, but Phase 2 does not invoke an Agent Kit tool or generate transaction bytes.
- No Hedera client, RPC call, wallet signing, or transaction submission is present.
- No private key, seed, custody path, `.env` file, database write, or HCS submission is present.
- A `mock_policy_receipt_created` result is a local audit preview, not a Hedera ledger receipt.
- This repository is standalone and does not modify PFN core.

## Agent Kit integration

- Core package: `@hashgraph/hedera-agent-kit@4.0.0`
- SDK peer: `@hiero-ledger/sdk@2.81.0`
- HBAR tool identity: `transfer_hbar_tool`
- Policy lifecycle phase: `post_params_normalization`
- Runtime API: `POST /api/runtime/evaluate`
- Execution boundary: dry-run only

## Dependency posture

The current Agent Kit and Hiero SDK dependency chain reports unresolved
transitive `npm audit` findings, including protobuf and gRPC advisories without
available upstream fixes. Phase 2 does not accept transaction bytes, connect to
Hedera, or process untrusted ledger payloads. This prototype must not be
described as production-ready or promoted to live execution until those
dependencies and the runtime threat model are reviewed again.

Official references:

- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js)
- [Hedera AI and agents documentation](https://docs.hedera.com/solutions/ai)

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
