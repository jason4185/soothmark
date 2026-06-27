import { Logo } from "@/components/shared/Logo";

export function AppFooter() {
  return (
    <footer className="border-t border-border/80 bg-surface/75">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-text-muted sm:px-6 lg:px-8">
        <div>
          <Logo />
          <p className="mt-1 max-w-xl">GenLayer-native auditing for nondeterministic contract state safety.</p>
          <p className="mt-1 max-w-xl text-xs">Focused on intent, nondeterminism, state impact, and verification.</p>
        </div>
      </div>
    </footer>
  );
}
