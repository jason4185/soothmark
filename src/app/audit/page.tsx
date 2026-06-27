import { Suspense } from "react";
import { AuditInputPreview } from "@/components/landing/AuditInputPreview";

export default function AuditWorkspacePage() {
  return (
    <main>
      <Suspense fallback={null}>
        <AuditInputPreview />
      </Suspense>
    </main>
  );
}
