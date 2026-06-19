import type { GuardedCommerceRuntimeRun } from "@/lib/agent-runtime/types";

type RuntimeLifecycleProps = {
  runtimeRun: GuardedCommerceRuntimeRun;
};

export function RuntimeLifecycle({ runtimeRun }: RuntimeLifecycleProps) {
  function statusClasses(status: (typeof runtimeRun.lifecycle)[number]["status"]) {
    if (status === "completed") {
      return {
        card: "border-cyan-300/15 bg-cyan-300/[0.035]",
        text: "text-cyan-300",
      };
    }
    if (status === "escalated") {
      return {
        card: "border-amber-300/20 bg-amber-300/[0.045]",
        text: "text-amber-300",
      };
    }
    return {
      card: "border-rose-300/20 bg-rose-300/[0.045]",
      text: "text-rose-300",
    };
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a1220]/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Agent Kit runtime
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Dry-run lifecycle
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            The server normalizes intent, registers policy adapters, and stops
            before Agent Kit tool execution.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            runtimeRun.executionBoundary === "reached"
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
              : "border-rose-300/30 bg-rose-300/10 text-rose-200"
          }`}
        >
          Boundary {runtimeRun.executionBoundary.replace("_", " ")}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Package
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-slate-200">
            {runtimeRun.agentKit.packageName}@{runtimeRun.agentKit.packageVersion}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Agent mode
          </dt>
          <dd className="mt-2 font-mono text-xs text-slate-200">
            {runtimeRun.agentKit.mode}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Tool method
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-slate-200">
            {runtimeRun.agentKit.toolMethod}
          </dd>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <dt className="text-xs uppercase tracking-wider text-slate-500">
            Hook phase
          </dt>
          <dd className="mt-2 break-all font-mono text-xs text-slate-200">
            {runtimeRun.agentKit.hookPhase}
          </dd>
        </div>
      </dl>

      <ol className="mt-6 grid gap-3 lg:grid-cols-5">
        {runtimeRun.lifecycle.map((record, index) => (
          <li
            key={record.stage}
            className={`rounded-2xl border p-4 ${statusClasses(record.status).card}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${statusClasses(record.status).text}`}
              >
                {record.status}
              </span>
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase leading-5 tracking-wider text-slate-200">
              {record.stage.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {record.detail}
            </p>
          </li>
        ))}
      </ol>

      {runtimeRun.actionPreview ? (
        <div className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.035] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Would execute
          </p>
          <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-slate-500">Recipient</dt>
              <dd className="mt-1 font-mono text-slate-200">
                {runtimeRun.actionPreview.recipientAccountId}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Atomic amount</dt>
              <dd className="mt-1 font-mono text-slate-200">
                {runtimeRun.actionPreview.amountAtomic}{" "}
                {runtimeRun.actionPreview.currency}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Memo</dt>
              <dd className="mt-1 break-all font-mono text-slate-200">
                {runtimeRun.actionPreview.transactionMemo}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Execution</dt>
              <dd className="mt-1 font-semibold text-amber-200">
                Intentionally not invoked
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-4 text-sm text-rose-100">
          No action preview was produced because policy stopped the request
          before execution.
        </p>
      )}

      <div className="mt-6 grid gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs text-amber-100/80 sm:grid-cols-4">
        <span>Client created: no</span>
        <span>Transaction built: no</span>
        <span>Bytes generated: no</span>
        <span>Network submitted: no</span>
      </div>
    </section>
  );
}
