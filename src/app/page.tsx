import { PolicyDashboard } from "@/components/PolicyDashboard";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(139,92,246,0.12),transparent_24%)]" />
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
                  Hedera Policy Agent bounty · Phase 1
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-1.5 text-cyan-200">
                Mock only
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300">
                No keys
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300">
                No spend
              </span>
            </div>
          </div>

          <div className="mt-12 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
              Policy before payment
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              An agent can ask to buy.
              <span className="block text-slate-500">
                Policy decides whether it may.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Explore approved and blocked commerce requests across amount,
              recipient, purpose, currency, and daily budget checks. Phase 1
              creates a local audit preview and never touches the network.
            </p>
          </div>
        </header>

        <PolicyDashboard />

        <footer className="mt-8 border-t border-white/10 py-6 text-xs leading-5 text-slate-600">
          PFN Guarded Commerce Agent is a standalone bounty prototype. It does
          not modify PFN core and does not currently sign, submit, settle, or
          persist Hedera transactions.
        </footer>
      </div>
    </main>
  );
}
