import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "mark" | "lockup";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    mark: "h-7 w-7",
    text: "text-sm",
    gap: "gap-2.5",
  },
  md: {
    mark: "h-9 w-9",
    text: "text-base",
    gap: "gap-3",
  },
  lg: {
    mark: "h-12 w-12",
    text: "text-2xl",
    gap: "gap-3.5",
  },
};

export function Logo({ variant = "lockup", size = "sm", className }: LogoProps) {
  const sizes = sizeClasses[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center", sizes.gap, className)}>
      <LogoMark className={sizes.mark} />
      {variant === "lockup" && (
        <span className={cn("truncate font-semibold tracking-tight text-text-main", sizes.text)}>
          Soothmark
        </span>
      )}
    </span>
  );
}

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      className={cn("shrink-0 overflow-visible", className)}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Soothmark"
    >
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="11"
        className="fill-surface stroke-border"
        strokeWidth="1.4"
      />
      <path
        d="M12.6 11.6C19.2 7.5 29.1 9.2 29.1 15.4C29.1 21.5 11.2 18.6 11.2 25.8C11.2 32 21.6 33.5 28.4 28.4"
        className="stroke-text-main"
        strokeWidth="2.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12.6" cy="11.6" r="2.05" className="fill-text-main" />
      <path
        d="M20 17.3L23.7 21L20 24.7L16.3 21L20 17.3Z"
        className="fill-primary-soft stroke-primary"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18.35 21.05L19.45 22.1L21.9 19.75"
        className="stroke-primary"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28.4" cy="28.4" r="2.35" className="fill-[var(--accent-gold)]" />
    </svg>
  );
}
