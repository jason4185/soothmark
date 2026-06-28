import { Logo } from "@/components/shared/Logo";

export function AppFooter() {
  return (
    <footer className="border-t border-border/80 bg-surface/75">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-text-muted sm:px-6 lg:px-8">
        <div>
          <Logo />
          <p className="mt-1 max-w-xl">Soothmark helps GenLayer builders check if outside data is properly validated before it changes what their contract stores.</p>
          <p className="mt-1 max-w-xl text-xs">Intent → nondeterminism → state impact → validation/equivalence → result.</p>
        </div>
      </div>
    </footer>
  );
}
