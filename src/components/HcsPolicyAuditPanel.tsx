import type { PolicyDecisionHcsAuditResult } from "@/lib/agent-runtime/types";

type HcsPolicyAuditPanelProps = {
  result: PolicyDecisionHcsAuditResult | null;
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
};

export function HcsPolicyAuditPanel({
  result,
  pending,
  error,
  onSubmit,
}: HcsPolicyAuditPanelProps) {
  const audit = result?.hcsAudit ?? null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
        HCS policy audit
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Decision checkpoint
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Submit the current allowed, blocked, or escalated policy decision to
        Hedera Consensus Service when testnet operator env vars are configured.
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={onSubmit}
        className={`mt-6 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
          pending
            ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
            : "border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
        }`}
      >
        {pending ? "Submitting HCS policy audit..." : "Submit HCS policy audit"}
      </button>

      {error ? (
        <p
          className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-4 text-sm text-rose-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className={`mt-5 rounded-2xl border p-4 ${
            audit
              ? "border-emerald-300/20 bg-emerald-300/[0.045]"
              : "border-amber-300/20 bg-amber-300/[0.045]"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {result.status.replace("_", " ")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            {result.message}
          </p>

          {audit ? (
            <dl className="mt-4 grid gap-3 text-xs">
              <div>
                <dt className="text-slate-500">HCS topic</dt>
                <dd className="mt-1 break-all font-mono text-amber-100">
                  {audit.topicId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Audit transaction</dt>
                <dd className="mt-1 break-all font-mono text-amber-100">
                  {audit.transactionId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Sequence / message hash</dt>
                <dd className="mt-1 break-all font-mono text-slate-200">
                  {audit.topicSequenceNumber ?? "unavailable"} /{" "}
                  {audit.messageHash}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs text-amber-100/80">
        <span>Decision coverage: allowed / blocked / escalated</span>
        <span>Network: Hedera testnet only</span>
        <span>Persistence: no app database writes</span>
      </div>
    </section>
  );
}
