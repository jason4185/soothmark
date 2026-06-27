import { Suspense } from "react";
import { ExamplesPageClient } from "@/components/examples/ExamplesPageClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamplesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-6 h-32" />
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Skeleton className="h-[480px]" />
              <Skeleton className="h-[620px]" />
            </div>
          </div>
        </main>
      }
    >
      <ExamplesPageClient />
    </Suspense>
  );
}
