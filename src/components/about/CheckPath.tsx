const steps = ["Intent", "Nondeterminism", "State Impact", "Verification Check"];

export function CheckPath() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-surface p-4 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]">
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step} className="relative rounded-lg border border-border/70 bg-surface-soft px-4 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">0{index + 1}</p>
            <p className="mt-2 text-sm font-medium text-text-main">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
