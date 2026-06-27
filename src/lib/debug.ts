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
