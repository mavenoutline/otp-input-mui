
"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import { OtpInputProps, OtpInputRef } from "./types";
import { splitAllowed, defaultFormatSeconds, sanitizeInputChar } from "./utils";

const Root = styled("div", {
  name: "MuiOtpInput",
  slot: "Root",
  overridesResolver: (props, styles) => [styles.root],
})(() => ({
  display: "flex",
  flexDirection: "column",
  width: "100%",
}));

const Cells = styled("div", {
  name: "MuiOtpInput",
  slot: "Cells",
})(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(1.25),
  direction: "inherit",
}));

const Cell = styled(TextField, {
  name: "MuiOtpInput",
  slot: "Cell",
})(({ theme }) => ({
  ["& .MuiInputBase-input" as any]: {
    textAlign: "center",
    letterSpacing: "0.1em",
    fontVariantNumeric: "tabular-nums",
    WebkitTextSecurity: "none",
  },
  width: theme.spacing(6),
}));

const defaultAllowedNumber = /^[0-9]$/;
const defaultAllowedAny = /^.$/;

export const OtpInput = React.forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(props, ref) {
  const {
    length = 6,
    value,
    defaultValue,
    onChange,
    onComplete,
    onInvalidChar,
    type = "number",
    inputMode,
    allowedChars,
    mask = false,
    revealOnFocus = false,
    variant = "outlined",
    size = "medium",
    color = "primary",
    error,
    disabled,
    fullWidth,
    label,
    helperText,
    TextFieldProps,
    gap,
    renderSeparator,
    resend,
    id,
    name,
    className,
    sx,
    cellSx,
    placeholder,
    autoFocus,
    ...rest
  } = props;

  const isControlled = value != null;
  const allowed = allowedChars ?? (type === "number" ? defaultAllowedNumber : defaultAllowedAny);
  const [inner, setInner] = React.useState<string>(() => {
    if (isControlled) return value as string;
    return (defaultValue ?? "").slice(0, length);
  });

  const val = isControlled ? (value as string) : inner;
  const chars = React.useMemo(() => {
    const arr = new Array(length).fill("");
    for (let i = 0; i < Math.min(length, val.length); i++) {
      arr[i] = val[i];
    }
    return arr;
  }, [val, length]);

  const inputs = React.useRef<Array<HTMLInputElement | null>>(Array.from({ length }, () => null));

  const focus = (index = 0) => {
    const el = inputs.current[index];
    if (el && typeof el.focus === "function") el.focus();
  };
  const blur = () => {
    inputs.current.forEach((el) => el?.blur());
  };
  const clear = () => {
    updateValue("");
    focus(0);
  };
  const setValue = (v: string) => updateValue(v.slice(0, length));
  const getValue = () => (val ?? "");

  React.useImperativeHandle(ref, () => ({ focus, blur, clear, setValue, getValue }), [val, length]);

  React.useEffect(() => {
    if (!isControlled) return;
    if ((value ?? "").length === length) onComplete?.(value as string);
  }, [value, isControlled, length, onComplete]);

  const updateValue = (next: string) => {
    if (!isControlled) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const normalized = text.replace(/\s|[-_]/g, "");
    const allowedCharsOnly = splitAllowed(normalized, allowed).slice(0, length - index);
    const next = (val.slice(0, index) + allowedCharsOnly.join("") + val.slice(index + allowedCharsOnly.length)).slice(0, length);
    updateValue(next);
    const toFocus = Math.min(index + allowedCharsOnly.length, length - 1);
    requestAnimationFrame(() => focus(toFocus));
  };

  const onInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      const next = val.substring(0, index) + "" + val.substring(index + 1);
      updateValue(next);
      return;
    }
    // Take the last entered char to support mobile autofill & IME
    const ch = raw[raw.length - 1];
    const allowedCh = sanitizeInputChar(ch, allowed);
    if (allowedCh == null) {
      onInvalidChar?.(ch);
      return;
    }
    const next = (val.substring(0, index) + allowedCh + val.substring(index + 1)).slice(0, length);
    updateValue(next);
    if (index < length - 1) focus(index + 1);
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!val[index]) {
        if (index > 0) focus(index - 1);
      } else {
        const next = val.substring(0, index) + "" + val.substring(index + 1);
        updateValue(next);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      if (index > 0) focus(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      if (index < length - 1) focus(index + 1);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (val.length === length) onComplete?.(val);
    }
  };

  const inputType = type === "number" ? "tel" : "text";
  const detectInputMode = inputMode ?? (type === "number" ? "numeric" : "text");

  // Resend timer state
  const [remaining, setRemaining] = React.useState(() => {
    const seconds = resend?.seconds ?? 30;
    if (resend?.attemptsStorageKey) {
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(`${resend.attemptsStorageKey}:remaining`) : null;
        if (raw) return Math.max(0, parseInt(raw, 10));
      } catch {}
    }
    return resend?.autoStart === false ? 0 : seconds;
  });
  const [attempts, setAttempts] = React.useState<number>(() => {
    if (!resend?.attemptsStorageKey) return 0;
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(`${resend.attemptsStorageKey}:attempts`) : null;
      return raw ? parseInt(raw, 10) : 0;
    } catch { return 0; }
  });

  React.useEffect(() => {
    if (!resend) return;
    if (remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((s) => {
        const next = Math.max(0, s - 1);
        if (resend.attemptsStorageKey && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(`${resend.attemptsStorageKey}:remaining`, String(next));
          } catch {}
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, resend]);

  const startTimer = React.useCallback(() => {
    const seconds = resend?.seconds ?? 30;
    setRemaining(seconds);
    if (resend?.attemptsStorageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`${resend.attemptsStorageKey}:remaining`, String(seconds));
      } catch {}
    }
  }, [resend]);

  const handleResend = async () => {
    if (!resend?.onResend) return;
    if (resend?.maxAttempts != null && attempts >= resend.maxAttempts) return;
    await Promise.resolve(resend.onResend());
    setAttempts((a) => {
      const next = a + 1;
      if (resend?.attemptsStorageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(`${resend.attemptsStorageKey}:attempts`, String(next));
        } catch {}
      }
      return next;
    });
    startTimer();
  };

  React.useEffect(() => {
    if (autoFocus) {
      const id = setTimeout(() => focus(0), 0);
      return () => clearTimeout(id);
    }
    return;
  }, [autoFocus]);

  const timerFormat = resend?.format ?? defaultFormatSeconds;
  const showMask = mask && (!revealOnFocus || document?.activeElement == null || !(inputs.current as any).includes(document.activeElement));

  return (
    <Root className={className} sx={sx} id={id}>
      {label ? (
        <Typography variant="subtitle2" sx={{ mb: 1 }} component="label">
          {label}
        </Typography>
      ) : null}

      <Cells style={gap ? { gap } : undefined}>
        {chars.map((ch, i) => (
          <React.Fragment key={i}>
            <Cell
              id={name ? `${name}-${i}` : undefined}
              name={name}
              variant={variant}
              size={size}
              color={color}
              error={error}
              disabled={disabled}
              inputRef={(el) => (inputs.current[i] = el)}
              value={ch}
              onChange={(e) => onInput(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              inputProps={{
                inputMode: detectInputMode,
                pattern: type === "number" ? "[0-9]*" : undefined,
                autoComplete: "one-time-code",
                "aria-label": `OTP digit ${i + 1}`,
                maxLength: 2, // allow last typed char + existing to compute
                placeholder: placeholder ?? "",
                style: showMask ? { WebkitTextSecurity: "disc" } : undefined,
              }}
              sx={cellSx}
              {...rest}
              {...TextFieldProps}
            />
            {i < length - 1 ? (renderSeparator ?? null) : null}
          </React.Fragment>
        ))}
      </Cells>

      {(helperText || resend) ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
          {helperText ? (
            <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mr: 1 }}>
              {helperText}
            </Typography>
          ) : null}
          {resend ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size="small"
                onClick={handleResend}
                disabled={disabled || resend.disabled || remaining > 0 || (resend.maxAttempts != null && attempts >= resend.maxAttempts)}
              >
                {resend.label ?? "Resend"}
              </Button>
              <Typography variant="caption" color="text.secondary" aria-live="polite" role="status">
                {remaining > 0 ? timerFormat(remaining) : ""}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Root>
  );
});
