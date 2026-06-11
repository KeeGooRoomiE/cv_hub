//
//  merge.mjs
//  CV Hub
//
//  Created by Alexander Gusarov on 11.03.2026.
//  @spartan121
//
//  Usage: node src/scripts/merge.mjs
//  Reads profiles.yml + languages.yml, merges base + spec YAMLs,
//  writes artifacts to public/cv/
//

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse, stringify } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

const contentDir = join(root, 'src/content');
const outputDir  = join(root, 'public/cv');

// --- Helpers ---

function readYaml(path) {
  if (!existsSync(path)) return null;
  return parse(readFileSync(path, 'utf8'));
}

// NOTE (intentional): a profile spec REPLACES the experience set, it does not
// append to it. The result is exactly the spec's entries — each shallow-merged
// over the base entry whose `company` matches (so a spec entry can carry just
// `{ company }` to inherit base fields). Base experiences not listed in the spec
// are dropped, and matching is by exact `company` string. This lets each profile
// curate its own ordered list of relevant jobs.
function mergeExperience(base, spec) {
  if (!spec || spec.length === 0) return base;

  return spec.map(specEntry => {
    const baseEntry = base.find(b => b.company === specEntry.company);
    if (!baseEntry) return specEntry;
    return { ...baseEntry, ...specEntry };
  });
}

function mergeCV(base, spec) {
  if (!spec) return base;

  const result = { ...base };

  for (const key of Object.keys(spec)) {
    if (key === 'experience') {
      result.experience = mergeExperience(base.experience ?? [], spec.experience);
    } else if (key === 'skills') {
      result.skills = spec.skills;
    } else {
      result[key] = spec[key];
    }
  }

  return result;
}

// --- Main ---

const profilesRaw  = readYaml(join(contentDir, 'profiles/profiles.yml'));
const languagesRaw = readYaml(join(contentDir, 'languages/languages.yml'));

if (!languagesRaw) {
  console.error('❌ languages.yml not found');
  process.exit(1);
}

const profiles = profilesRaw?.profiles ?? [{ id: 'default', slug: '', spec: null }];
const langIds     = languagesRaw.languages.map(l => l.id);
const defaultLang = languagesRaw.default;

// Invariant: routing and dropdown links key on profile.slug, while merged CV
// filenames and download URLs (resume_{lang}_{spec}) key on profile.spec.
// If they diverge, a profile page (/{slug}/) and its CV/downloads silently
// desync. Enforce slug === spec (both empty/null for the default profile).
for (const p of profiles) {
  const slugNorm = p.slug || null;
  const specNorm = p.spec ?? null;
  if (slugNorm !== specNorm) {
    console.error(
      `❌ Profile "${p.id}": slug (${JSON.stringify(p.slug)}) and spec ` +
      `(${JSON.stringify(p.spec)}) must match. Set spec === slug, or leave ` +
      `both empty/null for the default profile.`
    );
    process.exit(1);
  }
}

mkdirSync(outputDir, { recursive: true });

let generated = 0;

for (const profile of profiles) {
  for (const lang of langIds) {

    // --- resolve base ---
    let base = readYaml(join(contentDir, `cv/${lang}.yaml`));

    if (!base) {
      const defaultBase = readYaml(join(contentDir, `cv/${defaultLang}.yaml`));
      if (!defaultBase) {
        console.warn(`⚠️  Default base not found, skipping ${lang}`);
        continue;
      }
      console.warn(`⚠️  No base for ${lang}, falling back to ${defaultLang}`);
      base = defaultBase;
    }

    // --- resolve spec ---
    let spec = null;
    if (profile.spec) {
      const specPath = join(contentDir, `cv/${lang}_${profile.spec}.yaml`);
      spec = readYaml(specPath);
      if (!spec) {
        console.warn(`⚠️  Spec not found: ${lang}_${profile.spec}.yaml, falling back to base`);
      }
    }

    // --- merge & write ---
    const merged  = mergeCV(base, spec);
    const outName = profile.spec ? `${lang}_${profile.spec}.yaml` : `${lang}.yaml`;
    const outPath = join(outputDir, outName);

    writeFileSync(outPath, stringify(merged), 'utf8');
    console.log(`✓ ${outName}`);
    generated++;
  }
}

console.log(`\n✓ Generated ${generated} artifact(s) → public/cv/`);