<!--
  pull_request_template.md
  CV Hub

  Keep it short — fill in what applies and delete the rest.
-->

## Summary

<!-- What does this PR change, and why? One or two sentences is plenty. -->

## Type of change

- [ ] `fix` — bug fix
- [ ] `feat` — new feature or YAML field
- [ ] `docs` — documentation only
- [ ] `style` — styling / visual only
- [ ] `refactor` — no behaviour change

## How I tested

<!-- e.g. ran the dev server, checked /showcase on mobile, regenerated the PDFs -->

- [ ] `npm run dev` — verified locally
- [ ] `GITHUB_REPOSITORY="KeeGooRoomiE/cv_hub" npx astro build` — build passes

## Checklist

- [ ] **Changelog** — code/project changes are recorded in **both** `CHANGELOG.md` and `src/content/changelog/changelog.yaml`, grouped **Added → Changed → Fixed → Removed**.
      *Content-only edits (CV data, showcase cards, case studies, images) don't need a changelog entry.*
- [ ] **No hardcoded base path** — internal links and assets go through `withBase()` or `import.meta.env.BASE_URL`, never a literal `/cv_hub/`.
- [ ] **Media** (if added) — images compressed before commit (pixel art / transparency → PNG, screenshots / photos → JPEG, covers ≲ 400 KB), and the media folder name matches its showcase slug.
- [ ] **Docs** — updated `ARCHITECTURE.md` / `docs/LLM-CONTEXT.md` if this changes architecture, data flow, routing, CI or a convention.
- [ ] **Profiles** (if touched) — `profile.slug` still equals `profile.spec` (`merge.mjs` fails the build otherwise).

## Screenshots

<!-- For any visual change, before/after helps a lot. Delete if not applicable. -->

## Related issues

<!-- e.g. Closes #12 -->
