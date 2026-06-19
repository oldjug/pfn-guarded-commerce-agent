import type { MockPolicyProof } from "@/lib/policy/types";

type ProofTrailProps = {
  proof: MockPolicyProof;
};

export function ProofTrail({ proof }: ProofTrailProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a1220]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Local proof trail
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Mock policy receipt
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            A portable audit preview for the policy decision. This is not a
            Hedera payment receipt and was not submitted to HCS.
          </p>
        </div>
        <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200">
          {proof.receipt.status.replaceAll("-", " ")}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Proof ID
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-slate-200">
            {proof.proofId}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Fulfillment target
          </dt>
          <dd className="mt-2 text-sm font-semibold text-emerald-100">
            {proof.receipt.fulfillmentTarget}
          </dd>
        </div>
      </dl>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Decision
          </dt>
          <dd className="mt-2 font-mono text-xs uppercase text-slate-200">
            {proof.receipt.decision}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Policy version
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-slate-200">
            {proof.receipt.policyVersion}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Source payment
          </dt>
          <dd className="mt-2 text-xs leading-5 text-slate-200">
            {proof.receipt.sourcePayment}
          </dd>
        </div>
      </dl>

      <ol className="mt-6 space-y-3">
        {proof.events.map((event, index) => (
          <li key={`${event.type}-${index}`} className="flex gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-cyan-300 bg-[#0a1220]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                {event.type.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {event.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs text-amber-100/80 sm:grid-cols-3">
        <span>Live spend: no</span>
        <span>Receipt ID: {proof.receipt.receiptId}</span>
        <span>HCS topic: {proof.receipt.hcsTopicId ?? "none"}</span>
      </div>
    </section>
  );
}
