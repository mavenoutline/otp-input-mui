"use client";
import * as React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled, useTheme } from "@mui/material/styles";
import type { OtpInputProps, OtpInputRef, ResendRenderState } from "./types";
import {
  DEFAULT_ALLOWED,
  defaultFormatSeconds,
  extractTyped,
  splitAllowed,
  stripPasteSeparators,
} from "./utils";
import { useResendTimer } from "./useResendTimer";

export const otpInputClasses = {
  root: "MuiOtpInput-root",
  label: "MuiOtpInput-label",
  cells: "MuiOtpInput-cells",
  cell: "MuiOtpInput-cell",
  separator: "MuiOtpInput-separator",
  footer: "MuiOtpInput-footer",
  helperText: "MuiOtpInput-helperText",
  resend: "MuiOtpInput-resend",
} as const;

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");

const Root = styled("div", {
  name: "MuiOtpInput",
  slot: "Root",
  overridesResolver: (_props, styles) => styles.root,
})({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
});

const Cells = styled("div", {
  name: "MuiOtpInput",
  slot: "Cells",
  overridesResolver: (_props, styles) => styles.cells,
})(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.25),
}));

const Cell = styled(TextField, {
  name: "MuiOtpInput",
  slot: "Cell",
  overridesResolver: (_props, styles) => styles.cell,
  shouldForwardProp: (prop) => prop !== "stretch",
})<{ stretch?: boolean }>(({ theme, size, stretch }) => ({
  flex: stretch ? "1 1 0" : "0 0 auto",
  minWidth: 0,
  width: stretch ? "auto" : theme.spacing(size === "small" ? 5 : 6),
  "& .MuiInputBase-input": {
    textAlign: "center",
    paddingLeft: 0,
    paddingRight: 0,
    fontSize: size === "small" ? "1rem" : "1.25rem",
    fontVariantNumeric: "tabular-nums",
  },
}));

const Footer = styled("div", {
  name: "MuiOtpInput",
  slot: "Footer",
  overridesResolver: (_props, styles) => styles.footer,
})(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  columnGap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export const OtpInput = React.forwardRef<OtpInputRef, OtpInputProps>(function OtpInput(props, ref) {
  const {
    length: lengthProp = 6,
    value,
    defaultValue,
    onChange,
    onComplete,
    onInvalidChar,
    type = "number",
    inputMode,
    allowedChars,
    transform,
    mask = false,
    revealOnFocus = false,
    selectOnFocus = true,
    variant = "outlined",
    size = "medium",
    color = "primary",
    error = false,
    disabled = false,
    readOnly = false,
    fullWidth = false,
    label,
    helperText,
    placeholder,
    autoFocus = false,
    TextFieldProps: textFieldProps,
    gap,
    renderSeparator,
    resend,
    id: idProp,
    name,
    getCellAriaLabel,
    "aria-describedby": ariaDescribedBy,
    className,
    sx,
    cellSx,
    ...rootProps
  } = props;

  const length = Math.max(1, Math.floor(lengthProp));
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const generatedId = React.useId();
  const baseId = idProp ?? `otp-${generatedId.replace(/:/g, "")}`;
  const labelId = `${baseId}-label`;
  const helperId = `${baseId}-helper`;
  const allowed = allowedChars ?? DEFAULT_ALLOWED[type];

  const sanitize = (v: string) => splitAllowed(v, allowed, transform).slice(0, length).join("");

  // ---- value state -------------------------------------------------------
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState(() => sanitize(defaultValue ?? ""));
  const val = ((isControlled ? value : inner) ?? "").slice(0, length);

  // Latest value, updated synchronously so back-to-back events (paste then type) see it.
  const valRef = React.useRef(val);
  valRef.current = val;

  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);
  inputs.current.length = length;

  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const commit = (next: string) => {
    const prev = valRef.current;
    if (next === prev) return;
    valRef.current = next;
    if (!isControlled) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const firstEmptyIndex = () => Math.min(valRef.current.length, length - 1);

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputs.current[clamped]?.focus();
  };

  /** Write `chars` starting at `index`. A full-length entry replaces everything (autofill, full paste). */
  const insertAt = (index: number, chars: string[]) => {
    const cur = valRef.current;
    if (chars.length >= length) {
      commit(chars.slice(0, length).join(""));
      focusCell(length - 1);
      return;
    }
    const start = Math.min(index, cur.length);
    const next = (cur.slice(0, start) + chars.join("") + cur.slice(start + chars.length)).slice(0, length);
    commit(next);
    focusCell(Math.min(start + chars.length, length - 1));
  };

  const removeAt = (index: number) => {
    const cur = valRef.current;
    if (index < 0 || index >= cur.length) return;
    commit(cur.slice(0, index) + cur.slice(index + 1));
  };

  // ---- display -----------------------------------------------------------
  const maskChar = typeof mask === "string" && mask ? mask : "•";
  const masked = Boolean(mask) && !(revealOnFocus && focusedIndex !== null);
  const displayAt = (i: number) => {
    const ch = val[i] ?? "";
    return ch && masked ? maskChar : ch;
  };

  // ---- event handlers ----------------------------------------------------
  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    const raw = e.target.value;
    const prevDisplay = displayAt(i);
    if (raw === prevDisplay) return;
    if (raw === "") {
      removeAt(i);
      return;
    }
    const typed = extractTyped(raw, prevDisplay);
    // Multi-char input = autofill / IME commit; tolerate "123 456" style separators.
    const source = Array.from(typed).length > 1 ? stripPasteSeparators(typed) : typed;
    const accepted = splitAllowed(source, allowed, transform);
    if (accepted.length === 0) {
      onInvalidChar?.(typed);
      return;
    }
    insertAt(i, accepted);
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (readOnly || disabled) return;
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const accepted = splitAllowed(stripPasteSeparators(text), allowed, transform);
    if (accepted.length === 0) {
      onInvalidChar?.(text);
      return;
    }
    insertAt(i, accepted);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const back = isRtl ? "ArrowRight" : "ArrowLeft";
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    switch (e.key) {
      case "Backspace": {
        e.preventDefault();
        if (readOnly) return;
        if (valRef.current[i]) {
          removeAt(i);
        } else if (i > 0) {
          removeAt(i - 1);
          focusCell(i - 1);
        }
        return;
      }
      case "Delete":
        e.preventDefault();
        if (!readOnly) removeAt(i);
        return;
      case back:
        e.preventDefault();
        focusCell(i - 1);
        return;
      case forward:
        e.preventDefault();
        focusCell(i + 1);
        return;
      case "Home":
        e.preventDefault();
        focusCell(0);
        return;
      case "End":
        e.preventDefault();
        focusCell(firstEmptyIndex());
        return;
      case " ":
        e.preventDefault();
        return;
      default:
    }
  };

  const handleFocus = (i: number, e: React.FocusEvent<HTMLInputElement>) => {
    // Keep the code contiguous: never let focus land past the first empty cell.
    const target = firstEmptyIndex();
    if (i > target) {
      focusCell(target);
      return;
    }
    setFocusedIndex(i);
    if (selectOnFocus) {
      const el = e.target;
      // Deferred so Safari's mouseup does not collapse the selection.
      setTimeout(() => {
        if (el.ownerDocument.activeElement === el) el.select();
      }, 0);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!inputs.current.includes(e.relatedTarget as HTMLInputElement)) setFocusedIndex(null);
  };

  // ---- resend ------------------------------------------------------------
  const timer = useResendTimer(resend ? resend : { autoStart: false });

  const handleResend = () =>
    timer.resend().then(
      () => {
        if (resend?.clearOnResend !== false) {
          commit("");
          focusCell(0);
        }
      },
      () => {
        /* surfaced through `error` in the render state */
      },
    );

  // ---- imperative API ----------------------------------------------------
  React.useImperativeHandle(ref, () => ({
    focus: (index) => focusCell(index ?? firstEmptyIndex()),
    blur: () => inputs.current.forEach((el) => el?.blur()),
    clear: () => {
      commit("");
      focusCell(0);
    },
    setValue: (v) => commit(sanitize(v)),
    getValue: () => valRef.current,
    startResendTimer: timer.start,
    resetResend: timer.reset,
  }));

  React.useEffect(() => {
    if (autoFocus) focusCell(firstEmptyIndex());
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- render ------------------------------------------------------------
  const {
    slotProps: userSlotProps,
    inputProps: userInputProps,
    sx: userCellSx,
    className: userCellClassName,
    ...cellRest
  } = textFieldProps ?? {};
  const userHtmlInput =
    userSlotProps?.htmlInput && typeof userSlotProps.htmlInput === "object" ? userSlotProps.htmlInput : undefined;

  const resolvedInputMode = inputMode ?? (type === "number" ? "numeric" : "text");
  const defaultAriaLabel = (i: number, n: number) =>
    `${type === "number" ? "Digit" : "Character"} ${i + 1} of ${n}`;
  const describedBy = cx(helperText ? helperId : null, ariaDescribedBy) || undefined;

  const formatted = timer.isRunning ? (resend?.format ?? defaultFormatSeconds)(timer.remaining) : "";
  const resendDisabled = disabled || Boolean(resend?.disabled) || !timer.canResend;
  const resendState: ResendRenderState = { ...timer, resend: handleResend, formatted, disabled: resendDisabled };
  const exhausted = timer.attemptsLeft <= 0;

  const sxArray = (s: unknown) => (s == null ? [] : Array.isArray(s) ? s : [s]);

  return (
    <Root
      {...rootProps}
      id={baseId}
      role="group"
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={describedBy}
      className={cx(otpInputClasses.root, className)}
      sx={sx}
    >
      {label ? (
        <Typography
          component="label"
          id={labelId}
          htmlFor={`${baseId}-0`}
          variant="subtitle2"
          color={error ? "error" : disabled ? "text.disabled" : "text.primary"}
          className={otpInputClasses.label}
          sx={{ mb: 1 }}
        >
          {label}
        </Typography>
      ) : null}

      <Cells className={otpInputClasses.cells} style={gap != null ? { gap } : undefined}>
        {Array.from({ length }, (_, i) => {
          const separator =
            i < length - 1 ? (typeof renderSeparator === "function" ? renderSeparator(i) : renderSeparator) : null;
          return (
            <React.Fragment key={i}>
              <Cell
                {...cellRest}
                stretch={fullWidth}
                id={`${baseId}-${i}`}
                className={cx(otpInputClasses.cell, userCellClassName)}
                variant={variant}
                size={size}
                color={color}
                error={error}
                disabled={disabled}
                value={displayAt(i)}
                inputRef={(el: HTMLInputElement | null) => {
                  inputs.current[i] = el;
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => handlePaste(i, e)}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => handleFocus(i, e)}
                onBlur={handleBlur}
                sx={[...sxArray(cellSx), ...sxArray(userCellSx)] as never}
                slotProps={{
                  ...userSlotProps,
                  htmlInput: {
                    ...userInputProps,
                    ...userHtmlInput,
                    inputMode: resolvedInputMode,
                    pattern: type === "number" ? "[0-9]*" : undefined,
                    // Only the first cell advertises one-time-code so autofill targets a single field.
                    autoComplete: i === 0 ? "one-time-code" : "off",
                    autoCorrect: "off",
                    autoCapitalize: transform === "uppercase" ? "characters" : "off",
                    spellCheck: false,
                    readOnly,
                    placeholder: placeholder ?? "",
                    "aria-label": (getCellAriaLabel ?? defaultAriaLabel)(i, length),
                  },
                }}
              />
              {separator != null && separator !== false ? (
                <span className={otpInputClasses.separator} aria-hidden="true">
                  {separator}
                </span>
              ) : null}
            </React.Fragment>
          );
        })}
      </Cells>

      {name ? <input type="hidden" name={name} value={val} disabled={disabled} /> : null}

      {helperText || resend ? (
        <Footer className={otpInputClasses.footer}>
          {helperText ? (
            <Typography
              id={helperId}
              variant="caption"
              color={error ? "error" : "text.secondary"}
              className={otpInputClasses.helperText}
            >
              {helperText}
            </Typography>
          ) : (
            <span />
          )}
          {resend ? (
            <div className={otpInputClasses.resend} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {resend.render ? (
                resend.render(resendState)
              ) : exhausted ? (
                <Typography variant="caption" color="text.secondary">
                  {resend.exhaustedText ?? "No more resends available"}
                </Typography>
              ) : (
                <>
                  <Button
                    size="small"
                    onClick={handleResend}
                    disabled={resendDisabled}
                    aria-busy={timer.loading || undefined}
                  >
                    {resend.label ?? "Resend code"}
                  </Button>
                  {timer.isRunning ? (
                    <Typography variant="caption" color="text.secondary" role="timer">
                      {formatted}
                    </Typography>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </Footer>
      ) : null}
    </Root>
  );
});
