# @mavenoutline/otp-input-mui

Accessible OTP / PIN / verification-code input for React and Next.js, built on **MUI**.

- Paste a full code anywhere (`123 456`, `123-456`, `G-123456`) and it distributes across the cells
- iOS / Android SMS **one-time-code autofill**
- Numeric, alphanumeric or free-text codes, with optional upper/lower-casing
- Real masking (`•` or any character) with optional reveal-on-focus
- Built-in **resend button + countdown**, or a headless `useResendTimer` hook for your own UI
- Works with native `<form>`s, Next.js Server Actions and React Hook Form
- Keyboard support: arrows (RTL-aware), Backspace, Delete, Home/End
- Screen-reader friendly: labelled group, per-cell labels, linked helper text
- Ships `"use client"`, so it drops straight into the Next.js App Router

## Install

```bash
npm i @mavenoutline/otp-input-mui @mui/material @emotion/react @emotion/styled
```

Supports React 18/19 and MUI 6/7.

## Quick start

```tsx
import { useState } from "react";
import { OtpInput } from "@mavenoutline/otp-input-mui";

export function VerifyPhone() {
  const [code, setCode] = useState("");
  return (
    <OtpInput
      label="Enter the 6-digit code we sent to your phone"
      value={code}
      onChange={setCode}
      onComplete={(otp) => verify(otp)}
      autoFocus
    />
  );
}
```

## Recipes

### Verify, show an error, and let the user retry

`onComplete` fires each time user input fills the code, so it is safe to call your API directly.

```tsx
const ref = useRef<OtpInputRef>(null);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

<OtpInput
  ref={ref}
  disabled={loading}
  error={!!error}
  helperText={error ?? "Check your SMS inbox"}
  onChange={() => setError(null)}
  onComplete={async (otp) => {
    setLoading(true);
    const ok = await api.verify(otp);
    setLoading(false);
    if (!ok) {
      setError("That code is incorrect");
      ref.current?.clear(); // empties the cells and refocuses the first one
    }
  }}
/>;
```

### Resend with countdown and attempt limit

```tsx
<OtpInput
  resend={{
    seconds: 60,
    maxAttempts: 3,
    storageKey: "signup-otp", // survives page reloads (sessionStorage by default)
    onResend: () => api.sendCode(phone), // if this rejects, the attempt is not counted
  }}
/>
```

After a successful resend the cells are cleared and refocused (`clearOnResend: false` turns that off).
Text is customizable through `label`, `exhaustedText` and `format`:

```tsx
resend={{ label: "Send again", format: (s) => `in ${s}s`, exhaustedText: "Please contact support" }}
```

### Custom resend UI

Use `resend.render` to keep the built-in timer logic but draw your own UI:

```tsx
<OtpInput
  resend={{
    onResend: sendCode,
    render: ({ canResend, formatted, loading, resend }) =>
      canResend ? (
        <Link component="button" onClick={resend}>{loading ? "Sending…" : "Didn't get it? Resend"}</Link>
      ) : (
        <Typography variant="caption">Resend available in {formatted}</Typography>
      ),
  }}
/>
```

Or use the hook directly, anywhere in your page:

```tsx
import { useResendTimer } from "@mavenoutline/otp-input-mui";

const { remaining, canResend, resend, attemptsLeft } = useResendTimer({ seconds: 30, onResend: sendCode });
```

### PIN entry (masked)

```tsx
<OtpInput length={4} mask revealOnFocus label="Enter your PIN" />
<OtpInput length={6} mask="*" />
```

### Alphanumeric / backup codes with a separator

```tsx
<OtpInput
  length={8}
  type="alphanumeric"
  transform="uppercase"
  renderSeparator={(i) => (i === 3 ? "–" : null)} // ABCD–EFGH
/>
```

`allowedChars` lets you go further, e.g. hex only: `allowedChars={/^[A-F0-9]$/}` with `transform="uppercase"`.

### Native forms and Next.js Server Actions

Set `name` and the full code is submitted through a hidden input:

```tsx
// app/verify/page.tsx (a Server Component)
import { OtpInput } from "@mavenoutline/otp-input-mui";

export default function Page() {
  async function verify(formData: FormData) {
    "use server";
    const code = formData.get("otp"); // "123456"
  }
  return (
    <form action={verify}>
      <OtpInput name="otp" autoFocus />
      <button type="submit">Verify</button>
    </form>
  );
}
```

### React Hook Form

```tsx
<Controller
  name="otp"
  control={control}
  rules={{ minLength: 6, required: true }}
  render={({ field, fieldState }) => (
    <OtpInput
      ref={field.ref}
      value={field.value ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={!!fieldState.error}
      helperText={fieldState.error ? "Enter all 6 digits" : undefined}
    />
  )}
/>
```

### Full-width layout

```tsx
<OtpInput fullWidth gap={8} size="small" />
```

## API

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `length` | `number` | `6` | Number of cells |
| `value` / `defaultValue` | `string` | | Controlled / uncontrolled value |
| `onChange` | `(value) => void` | | |
| `onComplete` | `(value) => void` | | Fires each time user input fills the code |
| `onInvalidChar` | `(char) => void` | | A rejected keystroke or paste |
| `type` | `"number" \| "alphanumeric" \| "text"` | `"number"` | Character preset and mobile keyboard |
| `allowedChars` | `RegExp` | | Single-character test that overrides `type` |
| `transform` | `"uppercase" \| "lowercase"` | | |
| `inputMode` | HTML `inputMode` | from `type` | |
| `mask` | `boolean \| string` | `false` | `true` uses `•` |
| `revealOnFocus` | `boolean` | `false` | Show the real characters while focused |
| `selectOnFocus` | `boolean` | `true` | Typing into a filled cell replaces it |
| `variant` / `size` / `color` | MUI values | `outlined` / `medium` / `primary` | |
| `error` / `disabled` / `readOnly` | `boolean` | `false` | |
| `fullWidth` | `boolean` | `false` | Cells stretch to fill the row |
| `label` / `helperText` | `ReactNode` | | Linked to the group for screen readers |
| `placeholder` | `string` | | Per-cell placeholder, e.g. `"○"` |
| `autoFocus` | `boolean` | `false` | Focuses the first empty cell |
| `gap` | `number \| string` | `10px` | Space between cells |
| `renderSeparator` | `ReactNode \| (index) => ReactNode` | | Between cells |
| `resend` | `ResendConfig` | | See below |
| `name` | `string` | | Hidden input for form submission |
| `id` | `string` | auto | Cells get `${id}-${index}` |
| `getCellAriaLabel` | `(index, length) => string` | `"Digit 1 of 6"` | Localize screen-reader labels |
| `TextFieldProps` | `Partial<TextFieldProps>` | | Forwarded to every cell |
| `sx` / `cellSx` | `SxProps` | | Root / each cell |
| any other prop | | | Forwarded to the root `<div>` (`data-*`, `onBlur`, …) |

### `resend` (`ResendConfig`)

| Key | Type | Default |
| --- | --- | --- |
| `seconds` | `number` | `30` |
| `autoStart` | `boolean` | `true` (the first code was just sent) |
| `onResend` | `() => void \| Promise` | |
| `maxAttempts` | `number` | `Infinity` |
| `storageKey` | `string` | |
| `storage` | `"session" \| "local"` | `"session"` |
| `clearOnResend` | `boolean` | `true` |
| `label` | `ReactNode` | `"Resend code"` |
| `exhaustedText` | `ReactNode` | `"No more resends available"` |
| `format` | `(seconds) => string` | `m:ss` |
| `disabled` | `boolean` | |
| `render` | `(state) => ReactNode` | |

### Ref (`OtpInputRef`)

| Method | |
| --- | --- |
| `focus(index?)` | Focus a cell (defaults to the first empty one) |
| `blur()` | |
| `clear()` | Empty the value and focus the first cell |
| `setValue(value)` | Sanitized; fires `onChange` / `onComplete` |
| `getValue()` | |
| `startResendTimer()` | Restart the countdown without calling `onResend` |
| `resetResend()` | Reset attempts, countdown and stored state |

## Theming

Every part has a stable class name, exported as `otpInputClasses`:
`MuiOtpInput-root`, `-label`, `-cells`, `-cell`, `-separator`, `-footer`, `-helperText`, `-resend`.

```tsx
<OtpInput sx={{ [`& .${otpInputClasses.cell} input`]: { fontWeight: 700 } }} />
```

## Behaviour notes

- The code is always contiguous. Clicking a cell past the first empty one moves focus back to the first empty cell, and deleting a middle character shifts the rest left.
- Unicode digits (Arabic-Indic, Persian, Devanagari, Bengali, Thai, fullwidth) are converted to ASCII.
- Enter is not intercepted, so it submits the surrounding form.

## License

MIT © MavenOutline
