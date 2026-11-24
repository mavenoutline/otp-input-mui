import type * as React from "react";
import type { TextFieldProps } from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Character set preset.
 * - `number`: digits only (numeric keypad on mobile)
 * - `alphanumeric`: A–Z, a–z, 0–9
 * - `text`: any non-whitespace character
 */
export type OtpInputType = "number" | "alphanumeric" | "text";

export type OtpTransform = "uppercase" | "lowercase";

export type OtpInputRef = {
  /** Focus a cell. Defaults to the first empty cell. */
  focus: (index?: number) => void;
  blur: () => void;
  /** Clear the value and focus the first cell. */
  clear: () => void;
  /** Set the value (sanitized and truncated to `length`). Fires `onChange` and, if complete, `onComplete`. */
  setValue: (value: string) => void;
  getValue: () => string;
  /** Restart the resend countdown without calling `onResend` (e.g. after sending the first code yourself). */
  startResendTimer: () => void;
  /** Reset resend attempts and the countdown, including persisted state. */
  resetResend: () => void;
};

export type ResendTimerOptions = {
  /** Countdown length in seconds. @default 30 */
  seconds?: number;
  /** Start the countdown on mount (the first code was just sent). @default true */
  autoStart?: boolean;
  /** Called when the user asks for a new code. If it rejects, the attempt is not counted and the timer is not restarted. */
  onResend?: () => void | Promise<unknown>;
  /** Maximum number of resends. @default Infinity */
  maxAttempts?: number;
  /** Persist the countdown and attempts across reloads under this key. */
  storageKey?: string;
  /** Where to persist when `storageKey` is set. @default "session" */
  storage?: "session" | "local";
  /** @deprecated Use `storageKey`. */
  attemptsStorageKey?: string;
};

export type ResendTimerState = {
  /** Seconds left before a resend is allowed. */
  remaining: number;
  isRunning: boolean;
  attempts: number;
  /** `Infinity` when `maxAttempts` is not set. */
  attemptsLeft: number;
  /** True while `onResend` is pending. */
  loading: boolean;
  /** The error thrown by the last failed `onResend`, if any. */
  error: unknown;
  canResend: boolean;
  /** Call `onResend`, count the attempt and restart the countdown. */
  resend: () => Promise<void>;
  /** Restart the countdown without calling `onResend`. */
  start: () => void;
  /** Clear attempts, countdown and persisted state. */
  reset: () => void;
};

export type ResendRenderState = ResendTimerState & {
  /** Formatted countdown, e.g. "0:27". Empty when not running. */
  formatted: string;
  disabled: boolean;
};

export type ResendConfig = ResendTimerOptions & {
  /** Countdown formatter. @default m:ss */
  format?: (remaining: number) => string;
  /** Button text. @default "Resend code" */
  label?: React.ReactNode;
  /** Text shown once `maxAttempts` is reached. @default "No more resends available" */
  exhaustedText?: React.ReactNode;
  disabled?: boolean;
  /** Clear the input and focus the first cell after a successful resend. @default true */
  clearOnResend?: boolean;
  /** Replace the default resend UI entirely. */
  render?: (state: ResendRenderState) => React.ReactNode;
};

type OtpInputOwnProps = {
  /** Number of cells. @default 6 */
  length?: number;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires once each time user input fills the last empty cell. */
  onComplete?: (value: string) => void;
  /** Fires when the user types or pastes a character that is not allowed. */
  onInvalidChar?: (char: string) => void;

  /** Character set preset. @default "number" */
  type?: OtpInputType;
  /** Overrides the mobile keyboard hint derived from `type`. */
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Single-character test that overrides the `type` preset, e.g. `/^[A-F0-9]$/`. */
  allowedChars?: RegExp;
  /** Change the case of typed characters. */
  transform?: OtpTransform;
  /** Hide entered characters. `true` uses "•"; a string sets a custom mask character. */
  mask?: boolean | string;
  /** Show the real characters while the input has focus. */
  revealOnFocus?: boolean;
  /** Select a cell's content on focus so typing replaces it. @default true */
  selectOnFocus?: boolean;

  variant?: "outlined" | "filled" | "standard";
  size?: "small" | "medium";
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Stretch the cells to fill the container width. */
  fullWidth?: boolean;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  autoFocus?: boolean;

  /** Props forwarded to every cell's MUI `TextField`. */
  TextFieldProps?: Partial<TextFieldProps>;
  /** Space between cells (CSS value, or a number in px). */
  gap?: number | string;
  /** Element rendered between cells. Pass a function to place it selectively, e.g. `(i) => i === 2 ? "–" : null`. */
  renderSeparator?: React.ReactNode | ((index: number) => React.ReactNode);
  resend?: ResendConfig;

  /** Base id. Cells get `${id}-${index}`. Generated when omitted. */
  id?: string;
  /** Name of a hidden input that carries the full value, for native form submission. */
  name?: string;
  /** Accessible label per cell. @default "Digit 1 of 6" / "Character 1 of 6" */
  getCellAriaLabel?: (index: number, length: number) => string;
  "aria-describedby"?: string;
  className?: string;
  sx?: SxProps<Theme>;
  cellSx?: SxProps<Theme>;
};

/** Remaining props are forwarded to the root `<div>`. */
export type OtpInputProps = OtpInputOwnProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof OtpInputOwnProps | "children">;
