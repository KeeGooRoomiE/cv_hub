//
//  init.mjs
//  CV Hub
//
//  Created by Alexander Gusarov on 29.08.2026.
//  @spartan121
//
//  Onboarding script for a fresh fork: wipes the author's personal CV,
//  showcase and case-study data and reseeds it from docs/examples/*, so a
//  new user starts from a clean placeholder instead of hand-editing someone
//  else's resume.
//
//  Usage:
//    npm run init                          — interactive
//    npm run init -- --dry-run             — show what would happen, write nothing
//    npm run init -- --yes                 — skip the "are you sure" prompt
//    npm run init -- --name="..." --title="..." --lang=en|both --force
//
//  Safety:
//    - Refuses to run twice (marker file .cv-hub-initialized) unless --force.
//    - Backs up everything it's about to overwrite/delete into
//      .cv-hub-backup-{timestamp}/ before touching anything (skipped in
//      --dry-run). Both are gitignored — local safety net, not repo content.
//

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const ROOT = path.resolve('.');
const args = process.argv.slice(2);

const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const DRY_RUN = flag('dry-run');
const SKIP_CONFIRM = flag('yes') || flag('y');
const FORCE = flag('force');

const MARKER = path.join(ROOT, '.cv-hub-initialized');

const TARGETS = {
  cv:        path.join(ROOT, 'src/content/cv'),
  showcase:  path.join(ROOT, 'src/content/showcase'),
  profiles:  path.join(ROOT, 'src/content/profiles/profiles.yml'),
  media:     path.join(ROOT, 'public/media/projects'),
  languages: path.join(ROOT, 'src/content/languages/languages.yml'),
};

const EXAMPLES = {
  cv:      path.join(ROOT, 'docs/examples/example_cv.yaml'),
  project: path.join(ROOT, 'docs/examples/example_project.yaml'),
};

function log(msg) { console.log(msg); }
function warn(msg) { console.log(`⚠ ${msg}`); }

// ── Filesystem helpers ──────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!DRY_RUN && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (DRY_RUN) return;
  fs.cpSync(src, dest, { recursive: true });
}

function rmRecursive(target) {
  if (!fs.existsSync(target)) return;
  if (DRY_RUN) { log(`  [dry-run] would remove ${path.relative(ROOT, target)}`); return; }
  fs.rmSync(target, { recursive: true, force: true });
}

function writeFile(target, content) {
  if (DRY_RUN) { log(`  [dry-run] would write ${path.relative(ROOT, target)}`); return; }
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content, 'utf8');
}

// ── Content builders ─────────────────────────────────────────────────────────

function buildCvYaml(name, title) {
  const example = fs.readFileSync(EXAMPLES.cv, 'utf8');
  // The example already reads as a complete, sensible placeholder CV — only
  // the name/title line up top get swapped for what the user typed. Escape
  // double quotes defensively; YAML scalars below are quoted.
  const esc = (s) => String(s).replace(/"/g, '\\"');
  return example
    .replace(/^name: .*$/m,  `name: ${esc(name)}`)
    .replace(/^title: .*$/m, `title: ${esc(title)}`);
}

function buildShowcaseYaml() {
  const example = fs.readFileSync(EXAMPLES.project, 'utf8');
  // Drop the file's own leading comment header (it explains where to paste
  // this snippet — no longer relevant once it's already in place) and any
  // blank lines before the real content starts.
  const body = example.replace(/^(#.*\n)+\n*/, '');
  // example_project.yaml documents a `media:` entry pointing at a cover.png
  // that doesn't exist on disk — strip it so the fresh card doesn't render a
  // broken image. ProjectCard already handles zero media gracefully.
  const withoutMedia = body.replace(/\n {2}media:\n(?:\s{4}.*\n)+/, '\n');
  return `projects:\n${withoutMedia}`;
}

function buildProfilesYaml() {
  return `profiles:\n  - id: default\n    label: "Generalist"\n    slug: ""\n    spec: null\n`;
}

function buildCaseStudyYaml(lang) {
  const copy = {
    en: {
      role: 'Lead Developer',
      tagline: 'A short one-line pitch for the project, shown under the title.',
      overviewTitle: 'Overview',
      overviewBody:
        'This is your first case study. It renders from a block-based YAML\n' +
        'file — text, image, video and code blocks, in any order. See\n' +
        '`docs/examples/example_cs.yaml` for every block type with comments,\n' +
        'and `docs/INFO.md` §6 for the full reference.',
      whatTitle: 'What I did',
      bullets: ['Replace this with your real bullet points', 'One per line, as many as you need'],
    },
    ru: {
      role: 'Ведущий разработчик',
      tagline: 'Короткая строка-питч проекта под заголовком.',
      overviewTitle: 'Обзор',
      overviewBody:
        'Это твой первый кейс. Страница рендерится из YAML с блоками —\n' +
        'text, image, video и code, в любом порядке. Смотри\n' +
        '`docs/examples/example_cs.yaml` — там есть каждый тип блока с\n' +
        'комментариями, и `docs/INFO.md` §6 — полный референс.',
      whatTitle: 'Что я сделал',
      bullets: ['Замени на свои реальные пункты', 'По одному на строку, сколько нужно'],
    },
  }[lang];

  return `title: "My Project"
role: "${copy.role}"
year: "${new Date().getFullYear()}"
tagline: "${copy.tagline}"
shareable: true

blocks:

  - type: text
    title: "${copy.overviewTitle}"
    body: |
      ${copy.overviewBody.split('\n').join('\n      ')}

  - type: text
    title: "${copy.whatTitle}"
    bullets:
${copy.bullets.map((b) => `      - ${b}`).join('\n')}
`;
}

// ── Prompts ──────────────────────────────────────────────────────────────────

async function prompt(rl, question, fallback = '') {
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

async function confirm(rl, question) {
  const answer = (await rl.question(`${question} (y/N) `)).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  log('CV Hub — init\n');
  log('This clears the example/personal CV data that ships with the repo');
  log('(src/content/cv, src/content/showcase, public/media/projects, the');
  log('multi-profile config) and reseeds it from docs/examples/* so you');
  log('start from a clean placeholder instead of someone else\'s resume.\n');

  if (fs.existsSync(MARKER) && !FORCE) {
    warn('Already initialized in this checkout (.cv-hub-initialized exists).');
    warn('Pass --force to run again — it will back up and overwrite once more.');
    process.exit(1);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });

  const name  = value('name')  ?? await prompt(rl, 'Your name: ', 'Your Name');
  const title = value('title') ?? await prompt(rl, 'Your title / role (e.g. "Senior Backend Engineer"): ', 'Your Title');

  let lang = value('lang');
  if (!lang) {
    const both = await confirm(rl, 'Keep the RU slot too (seeded with the same placeholder text, for you to translate)?');
    lang = both ? 'both' : 'en';
  }

  log('\nAbout to overwrite:');
  log('  - src/content/cv/*.yaml            (all profile/language variants)');
  log('  - src/content/profiles/profiles.yml (reset to a single default profile)');
  log('  - src/content/showcase/*.yaml       (one example project)');
  log('  - public/media/projects/*           (one example case study, no media yet)');
  log('  - src/content/languages/languages.yml (default language set to "en")');
  log('\nEverything gets backed up to .cv-hub-backup-<timestamp>/ first (gitignored, local only).\n');

  if (!SKIP_CONFIRM) {
    const ok = await confirm(rl, 'Proceed?');
    if (!ok) { log('Aborted — nothing was touched.'); rl.close(); return; }
  }
  rl.close();

  if (DRY_RUN) log('\n[dry-run] no files will actually be written or removed.\n');

  // ── Backup ──
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(ROOT, `.cv-hub-backup-${stamp}`);
  if (!DRY_RUN) {
    ensureDir(backupDir);
    const singleFileTargets = new Set(['profiles', 'languages']);
    for (const [key, target] of Object.entries(TARGETS)) {
      if (!fs.existsSync(target)) continue;
      copyRecursive(target, path.join(backupDir, singleFileTargets.has(key) ? path.basename(target) : key));
    }
    log(`✔ Backed up existing data → ${path.relative(ROOT, backupDir)}/`);
  } else {
    log('[dry-run] would back up cv/, showcase/, profiles.yml, media/projects/');
  }

  // ── CV ──
  rmRecursive(TARGETS.cv);
  writeFile(path.join(TARGETS.cv, 'en.yaml'), buildCvYaml(name, title));
  if (lang === 'both') {
    writeFile(path.join(TARGETS.cv, 'ru.yaml'), `# TODO: translate — this is a copy of en.yaml\n${buildCvYaml(name, title)}`);
  }
  log('✔ src/content/cv/ reset');

  // ── Profiles (single default — multi-profile is opt-in, see docs/INFO.md) ──
  writeFile(TARGETS.profiles, buildProfilesYaml());
  log('✔ src/content/profiles/profiles.yml reset to a single default profile');

  // ── Showcase ──
  const showcaseYaml = buildShowcaseYaml();
  writeFile(path.join(TARGETS.showcase, 'projects_en.yaml'), showcaseYaml);
  if (lang === 'both') writeFile(path.join(TARGETS.showcase, 'projects_ru.yaml'), showcaseYaml);
  log('✔ src/content/showcase/ reset to one example project');

  // ── Case study ──
  rmRecursive(TARGETS.media);
  writeFile(path.join(TARGETS.media, 'my-project/my_project_en.yaml'), buildCaseStudyYaml('en'));
  if (lang === 'both') writeFile(path.join(TARGETS.media, 'my-project/my_project_ru.yaml'), buildCaseStudyYaml('ru'));
  log('✔ public/media/projects/ reset to one example case study (no cover image yet)');

  // ── Default site language ──
  // en.yaml is always the one with real, hand-written content (ru.yaml, when
  // kept, is a same-text placeholder awaiting translation) — the site's
  // default language should follow, regardless of what the original repo's
  // languages.yml happened to default to.
  if (fs.existsSync(TARGETS.languages)) {
    const current = fs.readFileSync(TARGETS.languages, 'utf8');
    const patched = current.replace(/^default:.*$/m, 'default: "en"');
    if (patched !== current) {
      writeFile(TARGETS.languages, patched);
      log('✔ src/content/languages/languages.yml default language set to "en"');
    }
  }

  if (!DRY_RUN) fs.writeFileSync(MARKER, `${new Date().toISOString()}\n`);

  log('\nDone. Next steps:');
  log('  1. npm run dev — preview locally');
  log('  2. Edit src/content/cv/en.yaml with your real data');
  log('  3. Add a cover image at public/media/projects/my-project/cover.png,');
  log('     then add it to the `media:` list in src/content/showcase/projects_en.yaml');
  log('     (see docs/examples/example_project.yaml for the shape)');
  log('  4. Flesh out public/media/projects/my-project/my_project_en.yaml —');
  log('     docs/examples/example_cs.yaml documents every block type');
  log('  5. Update the badge URLs at the top of README.md to your own repo');
  log('  6. Want multi-profile (DevOps/GameDev/etc.) back? See docs/INFO.md §4');
  if (!DRY_RUN) log(`\nOld data backed up in .cv-hub-backup-${stamp}/ if you need to recover anything.`);
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
