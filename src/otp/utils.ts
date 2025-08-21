
export function sanitizeInputChar(char: string, allowed: RegExp): string | null {
  if (!char) return null;
  // Normalize unicode digits (e.g., Arabic-Indic) to ASCII
  const normalized = char.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) % 0x660));
  return allowed.test(normalized) ? normalized : null;
}

export function splitAllowed(input: string, allowed: RegExp): string[] {
  const out: string[] = [];
  for (const ch of input) {
    const s = sanitizeInputChar(ch, allowed);
    if (s !== null) out.push(s);
  }
  return out;
}

export function defaultFormatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
