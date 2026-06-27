import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled}
      className={cn(
        "border border-primary/20 bg-[linear-gradient(135deg,var(--primary)_0%,color-mix(in_srgb,var(--primary)_82%,var(--accent-violet))_62%,var(--accent-gold)_150%)] text-primary-foreground shadow-[0_12px_30px_color-mix(in_srgb,var(--primary)_18%,transparent)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_color-mix(in_srgb,var(--primary)_24%,transparent)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
GradientButton.displayName = "GradientButton";
