import { PolicyDashboard } from "@/components/PolicyDashboard";
import { runGuardedCommerceDryRun } from "@/lib/agent-runtime/runtime";
import {
  DEFAULT_SCENARIO_ID,
  GUARDED_COMMERCE_POLICY,
  getDemoScenarioById,
} from "@/lib/policy/scenarios";

export default function Home() {
  const initialScenario = getDemoScenarioById(DEFAULT_SCENARIO_ID);
  if (!initialScenario) {
    throw new Error("Missing default guarded commerce scenario.");
  }

  const initialRuntimeRun = runGuardedCommerceDryRun(
    initialScenario.id,
    initialScenario.request,
    GUARDED_COMMERCE_POLICY,
    "2026-06-15T21:00:00.000Z",
  );

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(20,83,45,0.10),transparent_42%),linear-gradient(90deg,rgba(8,47,73,0.16),rgba(69,26,3,0.08))]" />
      <div className="relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-200">
                PFN
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Guarded Commerce Agent
                </p>
                <p className="text-xs text-slate-500">
                  Hedera AI Agent bounty sprint
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1.5 text-cyan-200">
                Agent Kit shell
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300">
                No keys
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300">
                HBAR + HCS proof
              </span>
            </div>
          </div>

          <div className="mt-12 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
              Policy before payment
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              An agent can ask to buy.
              <span className="block text-slate-500">
                Policy decides whether it may.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Explore allowed, blocked, and owner-review commerce requests
              across amount, recipient, purpose, currency, daily budget, and
              human approval checks. HCS can record each policy decision, and
              approved HBAR testnet payment proof can become a PFN receipt for
              XRP / XRPL EVM Feature NFT fulfillment.
            </p>
          </div>
        </header>

        <PolicyDashboard initialRuntimeRun={initialRuntimeRun} />

        <footer className="mt-8 border-t border-white/10 py-6 text-xs leading-5 text-slate-600">
          PFN Guarded Commerce Agent is a standalone bounty prototype. It does
          not modify PFN core and only submits Hedera testnet HBAR transactions
          plus HCS audit checkpoints when local operator env vars are
          configured and policies approve.
        </footer>
      </div>
    </main>
  );
}
