
# Contributing

Thanks for helping improve **@mavenoutline/otp-input-mui**!

## Setup
```bash
pnpm i # or npm i / yarn
pnpm dev
```

## Commands
- `pnpm dev` — watch build with tsup
- `pnpm build` — production build (esm + cjs + dts)
- `pnpm typecheck` — TypeScript checks

## Development notes
- Keep the component SSR-safe (no unguarded window/document).
- Avoid breaking public API without a major version bump.
- Write small, focused PRs with tests if possible.
