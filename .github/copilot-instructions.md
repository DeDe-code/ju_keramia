# Ju Keramia — GitHub Copilot Instructions

## Purpose

These are stable repository-wide instructions for AI-assisted development of `jukeramia/ju_keramia`.

Keep this file concise and durable. Detailed task scope belongs in the selected task or GitHub issue. Frontend/backend implementation rules belong in the corresponding custom coding agent.

---

## Communication and explanations

Use clear, junior-friendly language without removing important technical detail.

When using an abbreviation, spell it out and briefly explain what it means each time it appears in an explanation or handoff.

When introducing an important technical concept during implementation, explain:

- what it is;
- why Ju Keramia needs it;
- how it connects to the surrounding system;
- what problem it solves;
- what could go wrong;
- the chosen decision;
- what code or infrastructure changed;
- how the result was verified.

Clearly distinguish:

- **Verified fact** — confirmed from repository code, configuration, test output, or another authoritative source;
- **Reported result** — information reported by the user or another agent but not independently verified;
- **Recommendation** — a proposed approach that has not yet been implemented;
- **Decision** — an explicitly approved project choice;
- **Later** — useful work intentionally kept outside the current task.

Explain concepts when they become relevant to the implementation instead of giving large theory sections before the work.

## 1. Source-of-truth order

Use this order when deciding what is currently true:

1. **Selected approved task / GitHub issue** — immediate implementation contract: scope, non-goals, dependencies, acceptance criteria, and validation.
2. **Current repository implementation** — source of truth for files, current behavior, dependencies, and technical constraints.
3. **Approved architecture/specification/implementation-plan documents** — intended architecture and sequencing.
4. **Figma or approved design evidence** — visible interface/design authority only when the task explicitly depends on it.
5. **Repository guidance, including this file** — stable working rules, but never a substitute for inspecting the actual code.

If these sources materially conflict, stop and report the conflict. Do not silently guess.

The repository contains legacy implementation and documentation from earlier project stages. Do not copy an existing pattern merely because it already exists. Verify that it still fits the approved task and target architecture.

---

## 2. Current project foundation

Ju Keramia is evolving into a production-ready ceramics webshop.

Current verified application foundation:

- Nuxt 4 + Vue 3 + TypeScript;
- Nuxt/Nitro server routes;
- Nuxt UI and the existing Ju Keramia design system;
- Pinia for existing frontend state where appropriate;
- Supabase PostgreSQL for application data;
- Supabase Auth for authentication;
- HttpOnly cookies for server-managed authentication tokens;
- Cloudflare R2 for image/object storage through its S3-compatible interface;
- Nuxt Image for image presentation/optimization;
- Resend for email delivery;
- hCaptcha for contact-form abuse protection;
- npm as package manager;
- ESLint, Prettier, Husky, and lint-staged for code-quality workflow.

**HttpOnly** means a cookie cannot be read by normal browser JavaScript.

**S3 — Simple Storage Service:** an object-storage interface originally defined by Amazon Web Services. Cloudflare R2 provides an S3-compatible interface.

Do not introduce a new framework, database, authentication model, storage provider, state-management system, or paid infrastructure service without an approved task.

---

## 3. Current project phase

The current phase is **secure the technical foundation before deep webshop planning**.

Current sequence:

```text
Project instructions alignment
        ↓
Minimum safe automated-test foundation
        ↓
Secure administrator authorization
        ↓
Central administrator server protection
        ↓
Protect Cloudflare R2 upload permission
        ↓
Server-side request validation
        ↓
Remove/protect debug and test endpoints
        ↓
Simplify Continuous Integration / Continuous Delivery
        ↓
Foundation security regression review
        ↓
Deep webshop requirements and commerce architecture
```

**Continuous Integration / Continuous Delivery** means automated code checks and deployment processes.

Do not implement speculative checkout, payment, inventory, shipping, tax, refund, or customer-account architecture during foundation tasks.

---

## 4. Frontend / backend ownership

### Frontend — `TASK-FE-*`

Frontend work includes:

- `app/pages/`;
- `app/components/`;
- `app/layouts/`;
- frontend composables;
- Pinia state when it is frontend-owned behavior;
- styling and design tokens;
- responsive behavior;
- accessibility;
- loading/error presentation;
- client-side interaction and validation;
- Figma-driven visual implementation when explicitly required.

Frontend code is **not a security boundary**.

Hiding a button or validating a form in the browser does not replace server authorization or server validation.

### Backend — `TASK-BE-*`

Backend work includes:

- `server/api/`;
- `server/utils/`;
- Supabase PostgreSQL migrations;
- authentication integration;
- authorization and administrator permissions;
- **RLS — Row Level Security:** PostgreSQL rules controlling which database rows a user may read or change;
- server-side runtime validation;
- HttpOnly cookie handling;
- Cloudflare R2 presigned-upload authorization;
- Resend/hCaptcha server integration;
- database constraints;
- security-sensitive server behavior;
- backend/database tests;
- explicitly assigned infrastructure/workflow changes.

A **presigned URL** is a temporary URL granting permission for one storage operation without exposing the permanent storage secret.

If a task crosses frontend/backend boundaries, do not silently absorb the other layer's work. Report the dependency or follow the approved split.

---

## 5. Security principles

Sensitive operations must be decided on the server.

The browser may request an action; it must not decide whether the action is authorized.

Use layered protection:

```text
Browser request
      ↓
Nuxt server authentication/authorization
      ↓
server-side validation
      ↓
Supabase database security/constraints
      ↓
data
```

Keep authentication and authorization separate:

- **Authentication** = proving who the user is.
- **Authorization** = deciding what that authenticated user is allowed to do.

Never:

- expose private credentials to browser code;
- print or commit `.env` secrets;
- log passwords, raw access tokens, refresh tokens, authentication cookies, or provider secrets;
- trust a browser-provided user ID as proof of administrator permission;
- bypass authorization or validation to make code/tests pass;
- treat current legacy administrator metadata logic as approved future architecture unless the active task explicitly says so.

### Secret and credential handling (mandatory)

Secret protection takes precedence over convenience, token efficiency, and automated workflow optimization. If a faster or cheaper approach would require exposing, copying, or printing credential values, choose the slower safe approach or stop and report.

**Sensitive files** must not be read, copied, printed, uploaded, or included in temporary workspaces, logs, reports, generated artifacts, test fixtures, external tools, or AI prompts and responses:

- `.env` and `.env.*`, except explicitly non-sensitive templates such as `.env.example`;
- private keys;
- credential files;
- authentication tokens;
- password stores;
- any other file containing private credentials.

Reading actual credential values is a separately approved, security-sensitive operation. Routine coding, investigation, and dependency work must not require access to those values; use documented key names, `.env.example`, or synthetic placeholders instead.

**Temporary workspaces.** Never build a temporary workspace from an unrestricted repository copy, for example `cp -r . /tmp/project` or `rsync -a ./ /tmp/project`, because such a copy can silently carry credentials into an unguarded location. Create temporary workspaces from explicitly selected non-sensitive files only. For dependency-resolution experiments, copy only the required manifests, usually `package.json` and `package-lock.json`.

**Logging and reporting.** Never print or include real credentials in terminal output, error reports, diffs, screenshots, or handoff summaries. When a secret is suspected, report its type and location without revealing its value.

**Build artifacts.** Treat generated server bundles as potentially sensitive, because build-time environment values can be embedded in them. Do not upload or publish a generated artifact before checking whether build-time credentials could have been embedded. Perform that check with synthetic placeholder credentials, never by inspecting or copying real secrets.

A **generated server bundle** is the compiled output produced by the build process, for example the `.output/` directory from a Nuxt/Nitro build.

**Accidental exposure.** If sensitive information is accidentally accessed or copied:

1. stop the operation;
2. do not reproduce or transmit the credentials;
3. report the affected location and the operation performed;
4. state whether external transmission is known, suspected, or unverified;
5. request user approval before further remediation.

Never claim that deleting a file proves a credential was not exposed.

---

## 6. Database and migration safety

A **migration** is a versioned file that changes database structure or database rules.

Treat already-applied migrations as history.

Do not rewrite an old migration to change current behavior. Create a new forward migration.

Before changing database behavior:

- inspect related existing migrations;
- understand current objects and dependencies;
- consider existing-data impact;
- prefer constraints that prevent invalid states;
- use a positively identified isolated local/test database for destructive test operations.

Never run destructive database commands against an unknown, shared, staging, or production database.

---

## 7. TDD — Test Driven Development

**TDD — Test Driven Development** means defining a testable behavior with a failing test before implementing that behavior.

Use the practical cycle:

```text
RED
write the smallest focused failing test
        ↓
GREEN
write the smallest correct implementation that makes it pass
        ↓
REFACTOR
improve the design while the test remains passing
```

For each testable acceptance criterion:

1. write/update the focused test first;
2. run it and confirm the expected failure;
3. implement the smallest correct change;
4. rerun and make the test pass;
5. refactor only when useful;
6. rerun the focused test.

Tests should describe observable behavior, not unnecessarily duplicate private implementation details.

Security behavior should be tested explicitly where safe infrastructure exists, for example:

```text
anonymous user → blocked
normal authenticated user → blocked from admin action
administrator → allowed
invalid request data → rejected
```

If required test infrastructure does not exist:

- do not invent a fake test command;
- do not pretend Test Driven Development was followed;
- report the missing capability;
- add only the minimum approved test infrastructure when that belongs to the task.

Never weaken tests or production security to manufacture a passing result.

---

## 8. Software design — John Ousterhout

Follow the practical direction of John Ousterhout's _A Philosophy of Software Design_.

The primary design goal is to **minimize complexity over time**.

Apply these rules within task scope:

- prefer **deep modules**: substantial behavior hidden behind a small interface;
- hide implementation knowledge in the layer that owns it;
- keep interfaces simpler than their implementations;
- avoid shallow/pass-through wrappers;
- avoid information leakage and duplicated design knowledge;
- keep adjacent abstraction layers meaningfully different;
- prefer one clear owner for important rules;
- prevent invalid states with types, runtime schemas, and database constraints where appropriate;
- avoid unnecessary configuration;
- choose precise names;
- comment design intent, invariants, security assumptions, and non-obvious trade-offs rather than obvious syntax;
- for consequential interfaces, database models, security boundaries, or shared abstractions, briefly consider a credible alternative before choosing the design;
- treat change amplification, high cognitive load, duplicated knowledge, broad interfaces, and special-case proliferation as warning signs.

A **deep module** hides substantial complexity behind a small interface.

**Information leakage** means internal rules or implementation knowledge are exposed or duplicated across multiple parts of the system.

These principles do not justify unrelated refactoring or scope expansion.

---

## 9. Implementation discipline

Implement one approved task or bounded task slice at a time.

Before editing:

- confirm the Task ID;
- confirm frontend/backend ownership;
- inspect relevant code;
- verify the active branch is dedicated to the task and is not `main`;
- verify there are no unrelated local changes;
- confirm dependencies are satisfied.

During implementation:

- make the smallest coherent change;
- preserve sound existing patterns;
- do not preserve stale patterns merely because they exist;
- do not perform unrelated cleanup;
- do not add dependencies without a task-specific reason;
- do not silently change public contracts;
- report useful out-of-scope findings instead of implementing them.

---

## 10. Git and GitHub boundaries

The user owns Git/GitHub lifecycle writes.

Coding agents must not:

- create, switch, rename, or delete branches;
- pull;
- stage;
- commit or amend;
- rebase or cherry-pick;
- push or force-push;
- create/update/merge pull requests;
- modify GitHub Issues or Project state;
- change repository settings, secrets, permissions, or branch protection.

Read-only commands such as these are allowed:

```bash
git branch --show-current
git status --short --branch
git diff
git diff --stat
git log
git show
```

The coding agent implements and validates; the user performs repository lifecycle actions.

---

## 11. Validation

Use only commands that actually exist in the current repository or are explicitly introduced by the active task.

Do not invent tests or validation commands.

Current general repository checks include:

```bash
npm run lint
npm run build
npx nuxt typecheck
git diff --check
```

Use focused tests/checks while iterating and broader validation at meaningful task boundaries.

Never claim an unrun check passed.

If a failure is pre-existing and outside task scope, report it instead of silently expanding the task.

---

## 12. Custom coding agents

Implementation should use the relevant Ju Keramia custom agent when available:

- `.github/agents/ju-keramia-frontend-coding.agent.md`
- `.github/agents/ju-keramia-backend-coding.agent.md`

The selected task remains the immediate implementation contract.

Do not duplicate large agent-specific instructions into this file. Keep repository-wide guidance here and detailed implementation behavior in the owning agent.

---

## 13. Core project rule

Preserve useful requirements and behavior, **not obsolete implementation**.

Before copying an existing pattern, ask:

```text
Why does this exist?
Is the requirement still valid?
Does this implementation fit the approved architecture?
Does keeping it reduce or increase complexity?
```

A successful change must be correct, secure, testable, understandable, and maintainable—not merely functional.
