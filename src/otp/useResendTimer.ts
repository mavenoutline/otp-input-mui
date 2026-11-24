"use client";
import * as React from "react";
import type { ResendTimerOptions, ResendTimerState } from "./types";

type Persisted = { expiresAt: number | null; attempts: number };

function getStorage(kind: "session" | "local"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // access can throw (privacy mode, sandboxed iframes)
  }
}

function readPersisted(storage: Storage | null, key: string): Persisted | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : null,
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
    };
  } catch {
    return null;
  }
}

function writePersisted(storage: Storage | null, key: string, value: Persisted | null) {
  if (!storage) return;
  try {
    if (value) storage.setItem(key, JSON.stringify(value));
    else storage.removeItem(key);
  } catch {
    /* quota / access errors are non-fatal */
  }
}

const secondsUntil = (expiresAt: number | null) =>
  expiresAt == null ? 0 : Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

/**
 * Headless resend countdown. Use it on its own to build a custom resend UI,
 * or let `<OtpInput resend={...} />` use it for you.
 *
 * The countdown is stored as an absolute expiry time, so it stays accurate when the
 * tab is throttled in the background and, with `storageKey`, across page reloads.
 */
export function useResendTimer(options: ResendTimerOptions = {}): ResendTimerState {
  const {
    seconds = 30,
    autoStart = true,
    maxAttempts = Infinity,
    storage: storageKind = "session",
  } = options;
  const storageKey = options.storageKey ?? options.attemptsStorageKey;

  const onResendRef = React.useRef(options.onResend);
  onResendRef.current = options.onResend;

  // Initial state is deterministic so server and client render the same markup.
  const [remaining, setRemaining] = React.useState(autoStart ? seconds : 0);
  const [attempts, setAttempts] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(undefined);
  const expiresAtRef = React.useRef<number | null>(null);
  const attemptsRef = React.useRef(0);
  const loadingRef = React.useRef(false);

  const persist = React.useCallback(() => {
    if (!storageKey) return;
    writePersisted(getStorage(storageKind), storageKey, {
      expiresAt: expiresAtRef.current,
      attempts: attemptsRef.current,
    });
  }, [storageKey, storageKind]);

  const start = React.useCallback(() => {
    expiresAtRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    persist();
  }, [seconds, persist]);

  // On mount: restore persisted state, or start the first countdown.
  React.useEffect(() => {
    const saved = storageKey ? readPersisted(getStorage(storageKind), storageKey) : null;
    if (saved) {
      expiresAtRef.current = saved.expiresAt;
      attemptsRef.current = saved.attempts;
      setAttempts(saved.attempts);
      setRemaining(secondsUntil(saved.expiresAt));
    } else if (autoStart) {
      start();
    }
    // Only on mount / when the storage identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, storageKind]);

  const isRunning = remaining > 0;

  React.useEffect(() => {
    if (!isRunning) return;
    const tick = () => setRemaining(secondsUntil(expiresAtRef.current));
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  const attemptsLeft = Math.max(0, maxAttempts - attempts);
  const canResend = !isRunning && !loading && attemptsLeft > 0;

  const resend = React.useCallback(async () => {
    if (loadingRef.current) return;
    if (secondsUntil(expiresAtRef.current) > 0) return;
    if (attemptsRef.current >= maxAttempts) return;
    loadingRef.current = true;
    setLoading(true);
    setError(undefined);
    try {
      await onResendRef.current?.();
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      start();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [maxAttempts, start]);

  const reset = React.useCallback(() => {
    expiresAtRef.current = null;
    attemptsRef.current = 0;
    setAttempts(0);
    setRemaining(0);
    setError(undefined);
    if (storageKey) writePersisted(getStorage(storageKind), storageKey, null);
  }, [storageKey, storageKind]);

  return { remaining, isRunning, attempts, attemptsLeft, loading, error, canResend, resend, start, reset };
}
