import type { DemoScenario } from "@/lib/policy/types";

type ScenarioPickerProps = {
  scenarios: DemoScenario[];
  selectedScenarioId: string;
  onSelect: (scenarioId: string) => void;
};

export function ScenarioPicker({
  scenarios,
  selectedScenarioId,
  onSelect,
}: ScenarioPickerProps) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      role="group"
      aria-label="Demo requests"
    >
      {scenarios.map((scenario) => {
        const selected = scenario.id === selectedScenarioId;

        return (
          <button
            key={scenario.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(scenario.id)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              selected
                ? "border-cyan-300 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.045]"
            }`}
          >
            <span
              className={`mb-3 block h-1.5 w-9 rounded-full ${
                selected ? "bg-cyan-300" : "bg-white/20"
              }`}
            />
            <span className="block text-sm font-semibold text-white">
              {scenario.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              {scenario.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
