import type { PolicyGatedHbarExecutionResult } from "@/lib/agent-runtime/types";

type LiveHbarExecutionPanelProps = {
  result: PolicyGatedHbarExecutionResult | null;
  canExecute: boolean;
  pending: boolean;
  error: string | null;
  onExecute: () => void;
};

export function LiveHbarExecutionPanel({
  result,
  canExecute,
  pending,
  error,
  onExecute,
}: LiveHbarExecutionPanelProps) {
  const submittedReceipt =
    result?.status === "submitted" ? result.receipt : null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        Live HBAR testnet
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">
        Policy-gated execution
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Phase 3 can submit a real HBAR transfer on Hedera testnet only after
        every policy check passes. Mainnet, USDC, HCS, persistence, and
        deployment are still blocked.
      </p>

      <button
        type="button"
        disabled={!canExecute || pending}
        onClick={onExecute}
        className={`mt-6 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
          canExecute && !pending
            ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
            : "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
        }`}
      >
        {pending
          ? "Submitting policy-gated HBAR transfer..."
          : "Execute policy-gated HBAR testnet transfer"}
      </button>

      {!canExecute ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Available only for approved HBAR requests. Blocked requests and USDC
          preview requests cannot create a Hedera client.
        </p>
      ) : null}

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
            submittedReceipt
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

          {submittedReceipt ? (
            <dl className="mt-4 grid gap-3 text-xs">
              <div>
                <dt className="text-slate-500">Transaction ID</dt>
                <dd className="mt-1 break-all font-mono text-emerald-100">
                  {submittedReceipt.transactionId}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Receipt status</dt>
                <dd className="mt-1 font-semibold text-emerald-100">
                  {submittedReceipt.receiptStatus}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Recipient / amount</dt>
                <dd className="mt-1 font-mono text-slate-200">
                  {submittedReceipt.recipientAccountId} /{" "}
                  {submittedReceipt.amountTinybars} tinybars
                </dd>
              </div>
            </dl>
          ) : null}

          <ol className="mt-4 space-y-2">
            {result.lifecycle.slice(-4).map((record) => (
              <li key={`${record.stage}-${record.occurredAt}`}>
                <p className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                  {record.stage.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {record.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs text-amber-100/80">
        <span>Mainnet allowed: no</span>
        <span>Transaction bytes returned: no</span>
        <span>HCS write: no</span>
        <span>Persistence: no</span>
      </div>
    </section>
  );
}
