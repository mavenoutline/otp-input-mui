import type { OtpInputType, OtpTransform } from "./types";

/** Zero code points of Unicode decimal-digit blocks that users commonly type or paste. */
const DIGIT_ZEROS = [
  0x0660, // Arabic-Indic
  0x06f0, // Extended Arabic-Indic (Persian / Urdu)
  0x0966, // Devanagari
  0x09e6, // Bengali
  0x0e50, // Thai
  0xff10, // Fullwidth (CJK IMEs)
];

/** Map a non-ASCII decimal digit to its ASCII equivalent; any other char is returned unchanged. */
export function normalizeDigit(char: string): string {
  const code = char.codePointAt(0);
  if (code == null) return char;
  for (const zero of DIGIT_ZEROS) {
    if (code >= zero && code <= zero + 9) return String(code - zero);
  }
  return char;
}

export const DEFAULT_ALLOWED: Record<OtpInputType, RegExp> = {
  number: /^[0-9]$/,
  alphanumeric: /^[A-Za-z0-9]$/,
  text: /^\S$/u,
};

function applyTransform(char: string, transform?: OtpTransform): string {
  if (transform === "uppercase") return char.toUpperCase();
  if (transform === "lowercase") return char.toLowerCase();
  return char;
}

/** Normalize, transform and validate a single character. Returns `null` when it is not allowed. */
export function sanitizeInputChar(char: string, allowed: RegExp, transform?: OtpTransform): string | null {
  if (!char) return null;
  const normalized = applyTransform(normalizeDigit(char), transform);
  // Reset lastIndex in case a consumer passes a global/sticky regex.
  allowed.lastIndex = 0;
  return allowed.test(normalized) ? normalized : null;
}

/** Split a string into allowed characters, dropping invalid ones. Iterates by code point. */
export function splitAllowed(input: string, allowed: RegExp, transform?: OtpTransform): string[] {
  const out: string[] = [];
  for (const ch of input) {
    const s = sanitizeInputChar(ch, allowed, transform);
    if (s !== null) out.push(s);
  }
  return out;
}

/** Strip common separators users paste between groups, e.g. "123 456", "123-456", "G-123456". */
export function stripPasteSeparators(text: string): string {
  return text.replace(/[\s\-_.]/g, "");
}

/**
 * Work out what the user typed into a cell that previously displayed `prev`.
 * Handles the caret being before/after the existing char, a fully selected cell,
 * and multi-character insertions (mobile one-time-code autofill, IME commits).
 */
export function extractTyped(raw: string, prev: string): string {
  if (!prev || raw.length <= prev.length) return raw;
  if (raw.startsWith(prev)) return raw.slice(prev.length);
  if (raw.endsWith(prev)) return raw.slice(0, raw.length - prev.length);
  return raw;
}

/** Default resend countdown format: `m:ss`. */
export function defaultFormatSeconds(total: number): string {
  const safe = Math.max(0, Math.floor(total));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
