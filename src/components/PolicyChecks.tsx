import type { PolicyCheck } from "@/lib/policy/types";

type PolicyChecksProps = {
  checks: PolicyCheck[];
};

export function PolicyChecks({ checks }: PolicyChecksProps) {
  function badgeClass(result: PolicyCheck["result"]) {
    if (result === "pass") {
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    }
    if (result === "escalate") {
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    }
    return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Runtime policy checks
        </p>
      </div>
      <ul className="divide-y divide-white/8">
        {checks.map((check) => (
          <li
            key={check.key}
            className="grid gap-3 px-5 py-4 md:grid-cols-[180px_1fr_auto] md:items-center"
          >
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {check.label}
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {check.key}
              </p>
            </div>
            <div className="min-w-0 text-xs leading-5 text-slate-400">
              <p>
                <span className="text-slate-500">Expected:</span>{" "}
                {check.expected}
              </p>
              <p className="truncate" title={check.observed}>
                <span className="text-slate-500">Observed:</span>{" "}
                {check.observed}
              </p>
            </div>
            <span
              className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${badgeClass(check.result)}`}
            >
              {check.result === "pass"
                ? "Pass"
                : check.result === "escalate"
                  ? "Review"
                  : "Block"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
