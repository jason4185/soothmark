import { ExamplesPreview } from "@/components/landing/ExamplesPreview";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ResultPreview } from "@/components/landing/ResultPreview";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <ResultPreview />
      <ExamplesPreview />
    </main>
  );
}
