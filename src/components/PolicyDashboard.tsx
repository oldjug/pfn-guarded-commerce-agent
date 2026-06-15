"use client";

import { useMemo, useState } from "react";

import { PolicyChecks } from "@/components/PolicyChecks";
import { ProofTrail } from "@/components/ProofTrail";
import { ScenarioPicker } from "@/components/ScenarioPicker";
import {
  DEFAULT_SCENARIO_ID,
  DEMO_SCENARIOS,
  GUARDED_COMMERCE_POLICY,
  getCurrencyStatus,
} from "@/lib/policy/scenarios";
import {
  evaluateCommerceRequest,
  formatAtomicAmount,
} from "@/lib/policy/policyEngine";
import { createMockPolicyProof } from "@/lib/policy/proofTrail";

export function PolicyDashboard() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState(DEFAULT_SCENARIO_ID);
  const selectedScenario =
    DEMO_SCENARIOS.find(({ id }) => id === selectedScenarioId) ??
    DEMO_SCENARIOS[0];
  const evaluation = useMemo(
    () =>
      evaluateCommerceRequest(
        GUARDED_COMMERCE_POLICY,
        selectedScenario.request,
      ),
    [selectedScenario],
  );
  const proof = useMemo(
    () => createMockPolicyProof(evaluation, "2026-06-15T12:00:00.000Z"),
    [evaluation],
  );
  const currencyPolicy =
    selectedScenario.request.currency === "HBAR" ||
    selectedScenario.request.currency === "USDC"
      ? GUARDED_COMMERCE_POLICY.currencies[
          selectedScenario.request.currency
        ]
      : null;
  const amount = currencyPolicy
    ? formatAtomicAmount(
        selectedScenario.request.amountAtomic,
        currencyPolicy.decimals,
        selectedScenario.request.currency,
      )
    : selectedScenario.request.amountAtomic;
  const currencyStatus = getCurrencyStatus(selectedScenario.request.currency);

  return (
    <div className="space-y-6">
      <ScenarioPicker
        scenarios={DEMO_SCENARIOS}
        selectedScenarioId={selectedScenarioId}
        onSelect={setSelectedScenarioId}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="rounded-3xl border border-white/10 bg-[#0a1220]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Policy decision
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {selectedScenario.request.serviceName}
              </h2>
              <p className="mt-2 font-mono text-xs text-slate-500">
                {selectedScenario.request.requestId}
              </p>
            </div>
            <span
              aria-live="polite"
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] ${
                evaluation.decision === "approved"
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                  : "border-rose-300/30 bg-rose-300/10 text-rose-200"
              }`}
            >
              {evaluation.decision}
            </span>
          </div>

          <dl className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                Amount
              </dt>
              <dd className="mt-2 font-semibold text-slate-100">{amount}</dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                Recipient
              </dt>
              <dd className="mt-2 font-mono text-xs text-slate-100">
                {selectedScenario.request.recipientAccountId}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                Purpose
              </dt>
              <dd className="mt-2 text-sm font-semibold text-slate-100">
                {selectedScenario.request.purpose.replaceAll("_", " ")}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                Rail status
              </dt>
              <dd className="mt-2 text-sm font-semibold text-slate-100">
                {currencyStatus.replaceAll("_", " ")}
              </dd>
            </div>
          </dl>

          <PolicyChecks checks={evaluation.checks} />
        </section>

        <div className="space-y-6">
          <section
            className={`rounded-3xl border p-6 ${
              evaluation.decision === "approved"
                ? "border-emerald-300/20 bg-emerald-300/[0.055]"
                : "border-rose-300/20 bg-rose-300/[0.055]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Agent action
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {evaluation.decision === "approved"
                ? "Mock action ready"
                : "Action blocked"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {evaluation.decision === "approved"
                ? "Every runtime policy passed. Phase 1 stops here before wallet signing or network submission."
                : `${evaluation.blockedBy.length} policy check${
                    evaluation.blockedBy.length === 1 ? "" : "s"
                  } failed. No action package may proceed.`}
            </p>
            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-500"
            >
              Live Hedera spend disabled in Phase 1
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Runtime boundaries
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                "No private keys or seeds",
                "No wallet signing",
                "No Hedera RPC or transaction submission",
                "No HCS write or database persistence",
              ].map((boundary) => (
                <li key={boundary} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  {boundary}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <ProofTrail proof={proof} />
    </div>
  );
}
