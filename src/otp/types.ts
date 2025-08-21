
import type { TextFieldProps } from "@mui/material/TextField";
import * as React from "react";

export type OtpInputRef = {
  focus: (index?: number) => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
};

export type ResendConfig = {
  seconds?: number;
  autoStart?: boolean;
  onResend?: () => void | Promise<void>;
  format?: (remaining: number) => string;
  label?: React.ReactNode;
  disabled?: boolean;
  maxAttempts?: number;
  attemptsStorageKey?: string;
};

export type OtpInputProps = {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  onInvalidChar?: (char: string) => void;
  type?: "number" | "text";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  allowedChars?: RegExp;
  mask?: string | false;
  revealOnFocus?: boolean;
  variant?: "outlined" | "filled" | "standard";
  size?: "small" | "medium";
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  TextFieldProps?: Partial<TextFieldProps>;
  gap?: number | string;
  renderSeparator?: React.ReactNode;
  resend?: ResendConfig;
  id?: string;
  name?: string;
  "aria-describedby"?: string;
  className?: string;
  sx?: any;
  cellSx?: any;
  placeholder?: string;
  autoFocus?: boolean;
} & Omit<TextFieldProps, "onChange" | "value" | "defaultValue" | "variant" | "size" | "color" | "error" | "disabled" | "label" | "helperText">;
