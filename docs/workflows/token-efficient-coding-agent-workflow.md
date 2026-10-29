# Token-Efficient Coding Agent Workflow

## Purpose

This workflow removes redundant agent work without weakening correctness, security, reliability, maintainability, code quality, Test Driven Development, or necessary verification. Token savings are secondary to engineering quality.

It complements:

- `.github/copilot-instructions.md`
- `.github/agents/ju-keramia-frontend-coding.agent.md`
- `.github/agents/ju-keramia-backend-coding.agent.md`

Those files remain authoritative for architecture, safety, Git boundaries, Figma authority, and code quality. This guide is referenced explicitly in task prompts; the two coding-agent files are not changed to embed it.

## Core working model

Use **one GitHub task, one branch, and one PR**, but split implementation into **small coding-agent sessions**.

A task may require several implementation slices. Each slice should solve one coherent behavior and stop as soon as that slice is implemented and its focused tests pass.

Do not ask one coding-agent session to investigate, design, implement, test, review, and report an entire medium or large task when the work can be split safely.

## Session scope

For every coding-agent session:

1. Give the exact task ID and issue number if an issue exists.
2. Give only the current implementation slice.
3. Name the files or areas that are expected to matter.
4. Start with relevant files and allow additional investigation of necessary imports, dependencies, and security/architecture context.
5. State explicit non-goals.
6. State the exact focused tests to run.
7. Stop after the slice is complete.

Do not re-implement or redesign work completed by an earlier slice.

## Repository inspection rules

- Start with targeted investigation rather than exploring unrelated repository areas.
- Read named files first, then inspect any additional relevant files or dependency chains necessary for correctness or security.
- Read relevant planning/architecture documents when needed to resolve requirements, risks, or conflicts.
- Do not repeatedly re-read unchanged files or task context.
- Do not dump large files or tool results into chat.
- Use targeted search for a known symbol/file before any broad search.
- If the expected code cannot be found, expand investigation as needed, without expanding the approved implementation scope.

## External tools and MCP

**MCP — Model Context Protocol** connects agents to external tools and services. Use external tools deliberately, reusing already available verified context and avoiding unnecessary calls. There is **no numerical call budget**. Necessary investigation, security verification, and implementation must not stop because of token expenditure. Explain a genuine missing prerequisite or scope conflict rather than inventing a token-budget blocker.

### GitHub MCP

Do not use GitHub MCP when the full task contract is already present in the prompt.

Use GitHub MCP only when required issue/repository metadata is genuinely missing.

Never mutate GitHub state from the coding agent.

### Figma MCP

Use Figma only when visual evidence is required.

- Restrict access to the exact approved node IDs.
- Prefer one high-quality inspection per required node.
- Reuse already retrieved evidence.
- Do not explore the whole Figma file.
- Do not repeatedly fetch the same node unless a specific required detail is missing.

## Implementation behavior

- Work directly; do not narrate routine investigation or tool calls.
- Do not restate the task before working.
- Prefer the smallest coherent change that satisfies the current slice, and investigate as deeply as needed within its approved boundaries.
- Reuse existing project patterns.
- Avoid unrelated cleanup and refactoring.
- Avoid speculative abstractions.
- Do not implement future slices early.
- Keep SSR, accessibility, API contracts, security, and Figma requirements intact.

## Slice sizing

A good slice usually has:

- one main responsibility;
- a small number of closely related files;
- a focused test target;
- a clear completion condition.

Examples:

- one component plus its focused tests;
- one composable behavior plus its focused tests;
- one API interaction path plus rollback/error tests;
- one page state or integration behavior.

The task remains one branch and one PR even when several slices are used.

## Testing and validation responsibilities

**Coding agent (during each slice):**

- Perform the **Test Driven Development (TDD)** Red → Green → Refactor cycle for testable behavior: run the focused test to establish the expected failure, implement the smallest correct behavior, rerun to verify success, and keep it passing during useful refactoring.
- Run the **minimum sufficient focused validation**, including relevant negative-path security tests or focused regression checks when required by the changed behavior. Do not defer essential implementation/security feedback to the human review stage.
- Run `git diff --check` and inspect the slice diff. Report exactly which tests/checks ran, failed, passed, or were blocked.
- Do not automatically rerun full lint, type checking, complete test suites, formatting, and production builds after every small edit. Run a broader check during implementation only when genuinely necessary to prove the current change or explicitly requested.
- If meaningful test infrastructure is missing, identify the limitation; do not claim TDD was followed or invent meaningless tests.

**ChatGPT and user (independent review and broader checks):**

- ChatGPT examines the actual diff and defines a task-specific validation checklist. The user executes broader checks manually at meaningful review boundaries: lint, type checking, integration/regression tests, security audits, builds, and any other relevant check that exists or the task explicitly establishes.
- Required checks must be completed and results reviewed **before final approval or merge**. Moving a check to manual review changes who runs it, not whether it must run.
- If a required check is blocked, report the blocker and explicitly resolve it before claiming completion. Never weaken security controls or silently skip a quality gate to save tokens.

## Handoff format

Keep the final coding-agent response concise for routine work, but impose **no fixed length limit**. Include all necessary security, migration, compatibility, validation, blocker, and technical-decision details.

No tables. No repeated acceptance-criteria explanations. No narrative history.

Use this format:

```text
Task: <task / slice>
Files: <changed files>
Implemented:
- <up to 4 concise bullets>
Tests: <focused command/result>
Diff check: <pass/fail>
Blocker: <none or exact blocker>
READY FOR REVIEW
```

Do not paste large code blocks, logs, or tool output unless a failure requires a short excerpt.

## Stop conditions

Stop instead of expanding the session when:

- the requested slice requires a public API/architecture change not already approved;
- task dependencies are not satisfied;
- required Figma evidence is outside the approved node list;
- unrelated user work would be overwritten;
- the task contract is ambiguous in a way that materially affects implementation;
- implementation reveals a separate task that should not be folded into the current slice.

Report the blocker concisely and wait for direction.

## Git workflow

The coding agent must not stage, commit, push, create branches, create PRs, merge PRs, or mutate issues/projects.

The human user performs Git/GitHub write operations after review and validation.

## Task completion workflow

For a medium or large frontend, backend, or infrastructure task:

1. ChatGPT explains the task and proposes implementation slices.
2. User creates the dedicated task branch.
3. Coding agent implements slice A and runs focused tests.
4. ChatGPT reviews the handoff/diff.
5. Coding agent or user applies only necessary corrections.
6. Repeat for slices B/C as needed.
7. ChatGPT reviews the combined final diff.
8. ChatGPT defines the remaining task-specific validation requirements and the user executes the necessary broader checks (such as lint, type checking, integration/regression tests, security checks, format checking, production build, and `git diff --check`) before final approval/merge. Do not mechanically run irrelevant checks; do not omit required ones.
9. User commits, pushes, creates/merges the PR.
10. Only then start the next task.

## Prompt template

```text
Implement <TASK / issue>, slice <name>, on the current prepared branch.

Follow:
- .github/copilot-instructions.md
- .github/agents/ju-keramia-frontend-coding.agent.md (or backend agent, as appropriate)
- docs/workflows/token-efficient-coding-agent-workflow.md

SCOPE
<exact behavior for this slice>

EXPECTED FILES
<small file list>
Start with relevant files; inspect additional dependencies, security paths, and architecture context when needed for correctness.

DO NOT
- use GitHub MCP unless required repository or issue information is missing;
- investigate unrelated repository areas without a concrete task-related reason;
- read unrelated planning documents or unnecessarily reread task context;
- implement later slices;
- narrate routine investigation;
- dump large tool/file output.

FIGMA
<approved nodes or N/A>
Use only these nodes and reuse retrieved evidence.

TOOL EFFICIENCY
Avoid redundant external requests, but do all necessary investigation and focused verification. No numerical tool-call limit.

FOCUSED TESTS
<exact tests>

FINISH
- run focused tests;
- run git diff --check;
- inspect the slice diff;
- do not stage/commit/push.

HANDOFF
Be concise for routine handoff; expand to include any essential security, correctness, validation, or blocker details.
```
