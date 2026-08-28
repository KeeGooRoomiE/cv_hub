/**
 * resume-import-json.mjs
 *
 * Created by Alexander Gusarov on 04.03.2026.
 * @spartan121
 *
 * Usage:
 *   npm run resume:import -- resume.json en
 *
 * Result:
 *   src/content/cv/en.yaml
 *   public/downloads/json/cv_en.json
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npm run resume:import -- <resume.json> <lang>');
  process.exit(1);
}

const [inputFile, lang] = args;

const SUPPORTED_LANGS = ['en', 'ru'];
if (!SUPPORTED_LANGS.includes(lang)) {
  console.error(`❌ Unsupported lang: "${lang}". Supported: ${SUPPORTED_LANGS.join(', ')}`);
  process.exit(1);
}

const root        = process.cwd();
const yamlOut     = path.join(root, 'src/content/cv', `${lang}.yaml`);
const jsonOut     = path.join(root, 'public/downloads/json', `cv_${lang}.json`);
const schemaPath  = path.join(root, 'src/scripts/resume.schema.json');

const PRESENT = { en: 'Present', ru: 'н.в.' };

// ── Utils ─────────────────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateResume(json) {
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠ resume.schema.json not found, skipping validation');
    return;
  }

  const schema   = readJson(schemaPath);
  const ajv      = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validate = ajv.compile(schema);

  if (!validate(json)) {
    console.error('❌ Resume JSON validation failed');
    for (const err of validate.errors ?? []) {
      console.error(`  - ${err.instancePath || '(root)'} ${err.message}`);
    }
    process.exit(1);
  }

  console.log('✔ JSON Resume validated');
}

// ── Conversion ────────────────────────────────────────────────────────────────

function formatPeriod(startDate, endDate) {
  const start = startDate ?? '';
  const end   = endDate   ?? PRESENT[lang];
  return `${start} — ${end}`;
}

function convert(json) {
  const basics = json.basics ?? {};

  return {
    name:    basics.name    ?? '',
    title:   basics.label   ?? '',
    summary: basics.summary ?? '',

    contacts: [
      basics.email && { label: 'Email', url: `mailto:${basics.email}` },
      basics.url   && { label: 'Website', url: basics.url },
      ...(basics.profiles ?? []).map(p => ({ label: p.network, url: p.url })),
    ].filter(Boolean),

    // x_achievements — custom field, not part of JSON Resume standard
    ...(json.x_achievements?.length ? { achievements: json.x_achievements } : {}),

    skills: (json.skills ?? []).map(s => ({
      group: s.name,
      items: s.keywords ?? [],
    })),

    experience: (json.work ?? []).map(w => ({
      company:     w.name,
      role:        w.position,
      period:      formatPeriod(w.startDate, w.endDate),
      description: w.highlights ?? [],
      // omit stack key entirely if empty
      ...(w.keywords?.length ? { stack: w.keywords } : {}),
    })),

    education: (json.education ?? []).map(e => ({
      institution: e.institution,
      // combine studyType + area if both present: "Bachelor — Computer Science"
      degree: [e.studyType, e.area].filter(Boolean).join(' — '),
      period: formatPeriod(e.startDate, e.endDate),
    })),

    languages: (json.languages ?? []).map(l => ({
      language: l.language,
      level:    l.fluency ?? '',
    })),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  const json = readJson(inputFile);

  validateResume(json);

  const yamlData = convert(json);

  ensureDir(yamlOut);
  ensureDir(jsonOut);

  fs.writeFileSync(yamlOut, YAML.stringify(yamlData), 'utf8');
  fs.writeFileSync(jsonOut, JSON.stringify(json, null, 2), 'utf8');

  console.log(`✔ YAML written: ${yamlOut}`);
  console.log(`✔ JSON copied:  ${jsonOut}`);
}

run();