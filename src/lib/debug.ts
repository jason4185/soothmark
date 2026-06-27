const SOOTHMARK_DEBUG =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_SOOTHMARK_DEBUG === "true";

export function soothmarkDebug(...args: unknown[]) {
  if (SOOTHMARK_DEBUG) {
    console.log(...args);
  }
}

export function soothmarkWarn(...args: unknown[]) {
  if (SOOTHMARK_DEBUG) {
    console.warn(...args);
  }
}

export function soothmarkError(...args: unknown[]) {
  if (SOOTHMARK_DEBUG) {
    console.error(...args);
  }
}

export function soothmarkTrace(scope: "submit" | "polling" | "dashboard", message: string, value?: unknown) {
  const label = `[Soothmark ${scope} trace] ${message}`;
  if (value === undefined) {
    soothmarkDebug(label);
    return;
  }

  soothmarkDebug(label, value);
}
