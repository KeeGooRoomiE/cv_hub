# Claude Working Instructions — CV Hub

Project copy, derived from the global template and reconciled with how this project is actually run.
Keep this file lean. A bloated behaviour file gets ignored.

---

## Project context

- **Project:** CV Hub — data-driven personal CV / portfolio. One YAML source → live site + PDF/DOCX/TXT, deployed to GitHub Pages.
- **Stack:** Astro 7, TypeScript, YAML content, Playwright (PDF export), docx.js, GitHub Actions. No backend, no runtime JS by default.
- **Entry points:**
  - `src/pages/` — `index.astro`, `[...slug].astro` (profile × language), `showcase/` (list + `[...rest].astro` cases)
  - `src/content/` — YAML (cv, showcase, changelog, i18n, languages, profiles) validated by `src/content.config.ts` Zod schemas (Content Layer `glob()` loaders)
  - `src/scripts/merge.mjs` — profile merge pipeline (base + delta → per-profile, per-language artifacts)
  - `public/media/projects/{slug}/{slug}_{lang}.yaml` — block-based case studies
- **Key invariants:**
  - `profile.slug` **must equal** `profile.spec` (enforced by a `merge.mjs` guard).
  - A media folder name **must match** its showcase slug.
  - Two changelogs stay in sync: `CHANGELOG.md` (Keep a Changelog) + `src/content/changelog/changelog.yaml` (drives `/changelog`).

---

## Language

Chat in **Russian**. Repo content (code, docs, comments, commit text) stays **English** — match the existing repo.

---

## Orientation docs

Read these when relevant; don't announce it.

- `docs/LLM-CONTEXT.md` — LLM context of the project (the "context" doc)
- `ARCHITECTURE.md` (root) + `docs/ENGINEERING.md`, `docs/INFO.md` — architecture & engineering notes
- `docs/BKG_INFO.md` — background components (props, tuning, previews)
- `AUDIT.md` (root, **gitignored**) — working audit findings, one whole file appended as dated sections

### What is committed vs local
- **Committed:** `CLAUDE.md`, all repo docs (`ARCHITECTURE.md`, `CHANGELOG.md`, `README.md`, `CONTRIBUTING.md`, `docs/*`).
- **Gitignored / local:** `AUDIT.md` (root), and everything inside `.claude/` — `settings.local.json` and the compaction logs below. This is local working behaviour, not part of the repo.

## Documentation maintenance

Keep the project's doc base current **proactively** — don't wait to be asked. After a significant change:
- **`ARCHITECTURE.md` (+ `docs/ENGINEERING.md`)** — update when a component/service is added, module dependencies change, the data flow, routing, CI/CD or stack changes.
- **`docs/LLM-CONTEXT.md`** — update when project structure, conventions, invariants or "how to" flows change.

Small content edits (a showcase card, a case-study image) do not warrant doc updates. Architectural/technical/convention changes do.

## Compaction log

When the conversation context is compacted, write a log to `.claude/compacts/YYYY-MM-DD.md` (gitignored) capturing:
- what was being worked on
- decisions made
- what was left unfinished
- key context for the next session

This is the local memory that survives compaction — keep it accurate.

---

## Git

- Work **only in `main`**. No feature branches, no worktrees.
- The user owns all git operations via **GitHub Desktop** — they stage, split and commit themselves. Default stance is hands-off.
- **Do not** commit, push, merge, rebase, reset, tag, or add/remove worktrees — not even when it seems convenient. Only if explicitly told for a specific one-off.
- Read operations are free: `git status`, `git log`, `git diff`, `git show`, `git branch`, `git ls-files`, `git remote -v`.
- **Absolute prohibition:** `git push --force[-with-lease]`, deleting remote branches, rewriting published history.
- Local branch is the source of truth; never auto-sync to remote.
- GitHub API (PR/Issues/Actions): ask for a per-project token when needed; never store it.

---

## Changelog discipline

- Changelog records **project / code changes only**. Content edits — showcase cards, case-study YAML, images, ordering — are **not** changelogged.
- Keep `CHANGELOG.md` and `src/content/changelog/changelog.yaml` in sync.
- On the changelog page, group a version's entries by type in order: **Added → Changed → Fixed → Removed**.

---

## Build & verify

- After code or content changes, verify with:
  `GITHUB_REPOSITORY="KeeGooRoomiE/cv_hub" npx astro build`
  (the env var makes `site`/`base` resolve like production).
- Full pipeline (merge CV → generate resume → render PDF → build): `npm run build`.
- After verifying, confirm what changed in the built output when it matters (broken refs, eager image, generated sitemap, etc.).

---

## Images & media

- Compress before adding. Pick format by content:
  - pixel art / transparency → **PNG**
  - noisy screenshots, gradients, photos → **JPEG** (`sips`, q82–90, cap ~1400–1600px)
- Keep cover/hero images ≲ 400 KB. Heavy GIFs should become `<video>` mp4 (card infra already supports video).
- Media folder name = showcase slug.

---

## File system

- Read freely.
- Confirm before deleting/overwriting a file you didn't create or that isn't clearly disposable. When the instruction is explicitly "fix everything / clean up", scoped cleanup deletions (dead code, orphaned assets, untracked dupes) are fine without re-asking.
- Verify before destructive moves: identical-content checks / `git ls-files` to confirm something is safe to remove.

---

## How to work (decisiveness)

- When you have enough to act, **act**, then report briefly. Don't re-derive settled facts or re-litigate decided choices.
- On reversible choices, make a recommendation and proceed — don't enumerate options you won't pursue.
- Use `AskUserQuestion` only at **genuine forks the user owns**: version numbers, which project/scope to build next, public-facing disclosures (e.g. whether to publish a budget figure), naming. Put the recommended option first.
- For large, structural or non-obvious changes, give a short plan first. For routine multi-step work, just do it.
- Flag out-of-scope issues you notice (e.g. perf debt) as a one-line note rather than acting on them unasked.

---

## Code style

- Match the surrounding code's idiom, naming and comment density.
- Don't refactor code outside the request's scope. Don't delete comments or TODO markers unless asked.
- This project has no test suite; don't invent one unprompted. If tests are added later, follow the established convention and never disable a test to make it pass.

---

## Secrets & tokens

- Chat-passed secrets are acceptable for a session task — the user rotates them afterward.
- **Nothing from chat enters the repo:** no hardcoded secrets, in code, configs, examples or comments — not even realistic-looking placeholders.
- Reference secrets via env vars / `.env` (already gitignored). CI secrets go through the workflow `env:` block, not inline `${{ }}` in shell.

---

## MCP / agents

Last resort. Prefer native tools (bash, read, grep, edit). Don't spawn an agent or MCP tool when a bash/read/grep path exists. If one is genuinely needed: say what and why a simpler path fails, then proceed.

---

## Response format

Russian, concise, structured. Report what was done and the verification result. No filler — no "great question", no apologies. Detailed structured summaries are welcome for audits and complex multi-file changes; keep routine reports short.
