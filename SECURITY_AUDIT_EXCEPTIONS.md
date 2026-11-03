# Dependency Security Audit Exceptions

`npm audit` is all-or-nothing: it exits with a non-zero status for every reported vulnerability,
including low-severity ones, and it cannot represent an accepted risk. Ju Keramia therefore runs its
own policy on top of the raw audit report.

```bash
npm run audit:security
```

Implementation:

- [scripts/audit-check.mjs](./scripts/audit-check.mjs) — command-line wrapper, runs `npm audit --json`;
- [scripts/audit-policy.mjs](./scripts/audit-policy.mjs) — the policy itself (no I/O, unit tested);
- [scripts/audit-policy.test.mjs](./scripts/audit-policy.test.mjs) — proves accepted and rejected cases.

## Policy

- Every **moderate, high, and critical** finding fails the gate.
- **Low** and **info** findings are reported by npm but do not fail the gate, matching the previous
  `npm audit --audit-level=moderate` threshold.
- A finding is tolerated **only** when it appears in the reviewed exceptions below and matches the
  exact advisory, severity, and dependency chain recorded there.
- The gate fails closed. A failed or unparsable `npm audit` call, an empty response, an unknown
  severity, or a report whose counts disagree with its own metadata never passes.

## Current exceptions

| Advisory                                                                 | Package     | Severity | Dependency chain                                                                   |
| ------------------------------------------------------------------------ | ----------- | -------- | ---------------------------------------------------------------------------------- |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | `minimatch` | moderate | `minimatch` -> `eslint-plugin-import-x` -> `@nuxt/eslint-config` -> `@nuxt/eslint` |

The exception is implemented in `ACCEPTED_ADVISORY_URLS` and `ACCEPTED_CHAIN` in
[scripts/audit-policy.mjs](./scripts/audit-policy.mjs).

The policy additionally requires the vulnerable `minimatch` copy to have **`eslint-plugin-import-x`
as its only dependent**. If any other package starts depending on the vulnerable copy, the exception
stops applying and the gate fails.

### Why the current risk is limited

- The whole chain is **development tooling**: ESLint and its Nuxt configuration. It is not imported by
  application code, is not deployed in the production server bundle, and does not execute in the
  running Nuxt/Nitro server.
- The advisory is a **denial of service** through glob pattern amplification. It requires an
  attacker-controlled glob pattern.
- The glob patterns in this chain come from repository ESLint configuration files written by
  maintainers, not from user input or network requests.
- The only accepted advisory is the one above. A second advisory on `minimatch`, or a severity
  escalation to high/critical, is not covered and fails the gate.

### When the exception must be removed

Remove the exception when either of these becomes true:

1. `@nuxt/eslint-config` (via `eslint-plugin-import-x`) accepts `minimatch` `>=11.0.1`, and the
   dependency upgrade is applied; or
2. the advisory is withdrawn or a patched `minimatch` `10.x` release becomes available.

After removing it, delete the corresponding entry from `ACCEPTED_CHAIN`/`ACCEPTED_ADVISORY_URLS` and
confirm `npm run audit:security` still passes. If it does not pass, that is a real finding and must be
fixed, not re-added to the allow-list.

## Adding a new exception

New exceptions require an explicit security review and an approved task. They are never added just to
make CI green. Record the advisory, the exact dependency chain, why the risk is limited in this
project, and the removal condition in this file, then extend the policy constants and its tests.
