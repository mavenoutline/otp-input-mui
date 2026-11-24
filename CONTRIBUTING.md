
# Contributing

Thanks for helping improve **@mavenoutline/otp-input-mui**!

## Setup
```bash
npm i
npm run dev
```

## Commands
- `npm run dev`: watch build with tsup
- `npm run build`: production build (ESM + CJS + type declarations, keeps `"use client"`)
- `npm run typecheck`: TypeScript checks
- `npm test`: Vitest + Testing Library (jsdom)

## Development notes
- Keep the component SSR-safe (no unguarded window/document).
- Avoid breaking public API without a major version bump.
- Add a test in `test/` for every behaviour change.
- Record user-facing changes in `CHANGELOG.md`.
