
# @mavenoutline/otp-input-mui

Accessible, production-ready OTP / PIN input for React & Next.js built with **MUI**.  
Supports paste, auto-advance, backspace, **resend with timer**, SSR safety, a11y, IME, and mobile one-time-code autofill.

## Features
- MUI-themed inputs (`variant`, `size`, `color`, `error`, `helperText` support).
- Controlled & uncontrolled usage.
- Paste full OTP (handles spaces, hyphens, unicode digits).
- Auto focus next / previous on type & backspace.
- Masked display (e.g., •) with optional reveal on focus.
- Mobile & iOS SMS autofill (`autoComplete="one-time-code"`).
- Resend button with customizable timer, formatting, and callbacks.
- `onComplete` fires when all slots are filled.
- RTL-aware and accessible (labels, descriptions, roles).
- Imperative API via `ref`: `focus`, `blur`, `clear`, `setValue`.
- Fully typed, tree-shakeable, ESM & CJS builds via `tsup`.

## Install
```bash
npm i @mavenoutline/otp-input-mui
# peer deps
npm i @mui/material @emotion/react @emotion/styled
```

## Quick start
```tsx
import { OtpInput } from "@mavenoutline/otp-input-mui";

export default function Example() {
  const [code, setCode] = useState("");
  return (
    <OtpInput
      length={6}
      value={code}
      onChange={setCode}
      onComplete={(otp) => console.log("complete:", otp)}
      label="Enter verification code"
      resend={{
        seconds: 30,
        onResend: () => console.log("Resend clicked"),
      }}
      variant="outlined"
      size="medium"
      error={false}
      helperText="We sent it via SMS"
    />
  );
}
```

## Props
```ts
type OtpInputProps = {
  length?: number; // default 6
  value?: string;              // controlled
  defaultValue?: string;       // uncontrolled
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  onInvalidChar?: (char: string) => void;

  // Input behavior
  type?: "number" | "text"; // default "number"
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  allowedChars?: RegExp; // default: digits when type="number", otherwise /./
  mask?: string | false; // e.g., "•" to mask, false to show raw characters
  revealOnFocus?: boolean; // default: false

  // MUI
  variant?: "outlined" | "filled" | "standard";
  size?: "small" | "medium";
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  TextFieldProps?: Partial<import("@mui/material").TextFieldProps>;

  // Layout
  gap?: number | string;      // spacing between cells
  renderSeparator?: React.ReactNode; // element between cells (e.g., <Box sx={{mx:1}}>-</Box>)

  // Resend
  resend?: {
    seconds?: number; // default 30
    autoStart?: boolean; // default true
    onResend?: () => void | Promise<void>;
    format?: (remaining: number) => string; // default mm:ss
    label?: React.ReactNode; // "Resend"
    disabled?: boolean;
    maxAttempts?: number; // default Infinity
    attemptsStorageKey?: string; // to persist attempts across reloads
  };

  // A11y
  id?: string;
  name?: string;
  "aria-describedby"?: string;

  // Imperative API
  ref?: React.Ref<OtpInputRef>;
};

export type OtpInputRef = {
  focus: (index?: number) => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
};
```

## Resend timer text
The timer format can be customized:
```tsx
resend={{ seconds: 45, format: (s) => `Time remaining: ${s}s` }}
```

## Paste handling
Users can paste the entire code (e.g., `123 456` or `123-456`). Non-allowed characters are ignored.

## Next.js (SSR) notes
- Component is SSR-safe. Focus logic and `window` usage are guarded.
- For App Router (`app/`), include `"use client"` at the top of your page or component file where you render `<OtpInput />`.

## Theming
Uses your MUI theme. Customize via `sx` or theme overrides using the class name `MuiOtpInput-root` and `MuiOtpInput-cell`.

## License
MIT © mavenoutline
