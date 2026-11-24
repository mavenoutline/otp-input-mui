# Changelog

## 2.0.0

### Breaking
- Extra props no longer go to every cell's `TextField`. They go to the root `<div>`. Use `TextFieldProps` for cell props.
- `name` no longer goes on each cell. It renders one hidden input that holds the full code.
- `onComplete` now fires only from user input, `setValue()` or `clear()`. It no longer fires on mount, on every re-render while the controlled value is full, twice per completion, or on Enter.
- Resend state is now stored in `sessionStorage` by default as one JSON entry (`storage: "local"` restores the old persistence). `attemptsStorageKey` is deprecated in favour of `storageKey`.
- `sx` / `cellSx` are now typed as `SxProps<Theme>`.
- Default resend label is now "Resend code".

### Fixed
- SSR crash: `document` was read during render when `mask` was set.
- `"use client"` was stripped from the bundle, so the component broke in Next.js Server Components.
- SMS one-time-code autofill was truncated to one character (`maxLength: 2` and last-char-only handling).
- Extended Arabic-Indic / Persian digits were converted to wrong values (e.g. `۵` → `"149"`).
- Typing with the caret before an existing character kept the old character.
- Typing into a cell past the end of the value wrote to the wrong position.
- `mask` ignored the mask character and relied on non-standard `-webkit-text-security` (no Firefox support). `revealOnFocus` did not re-render.
- The resend timer reset whenever an inline `resend={{...}}` object was passed, drifted in background tabs, and restored stale time after a reload.
- A failed `onResend` still counted as an attempt and caused an unhandled rejection. Double-clicks could send twice.
- The countdown was announced to screen readers every second.
- `fullWidth` and `aria-describedby` had no effect. The label wasn't associated with the inputs.
- Every cell had `autocomplete="one-time-code"`, which confused autofill.
- Package: CJS consumers got ESM type declarations, `@emotion/*` peers were missing, and there was no `files` allow-list.

### Added
- `type="alphanumeric"`, `transform`, `readOnly`, `selectOnFocus`, `getCellAriaLabel`.
- `mask` accepts `true` or any character.
- `renderSeparator` accepts `(index) => ReactNode` for grouped codes.
- Resend: `render`, `exhaustedText`, `clearOnResend`, `storage`, loading and error state.
- Headless `useResendTimer` hook.
- Ref: `startResendTimer()`, `resetResend()`. `focus()` defaults to the first empty cell.
- Delete, Home/End and RTL-aware arrow keys. Backspace on an empty cell deletes the previous character.
- `otpInputClasses` export with stable class names.
- MUI 6 support.
