/**
 * resume-import-linkedin.mjs
 *
 * Created by Alexander Gusarov on 04.03.2026.
 * @spartan121
 *
 * Parses a standard English LinkedIn PDF export into JSON Resume + YAML.
 *
 * Usage:
 *   npm run resume:linkedin -- linkedin.pdf en
 *
 * Output:
 *   public/downloads/json/cv_en.json
 *   src/content/cv/en.yaml
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import YAML from 'yaml';
import { extractText as pdfExtractText } from 'unpdf';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npm run parse -- <linkedin.pdf> <lang>');
  process.exit(1);
}

const [inputFile, lang] = args;

const SUPPORTED_LANGS = ['en', 'ru'];
if (!SUPPORTED_LANGS.includes(lang)) {
  console.error(`❌ Unsupported lang: "${lang}". Supported: ${SUPPORTED_LANGS.join(', ')}`);
  process.exit(1);
}

const root    = process.cwd();
const jsonOut = path.join(root, 'docs', `cv_${lang}.json`);
const yamlOut = path.join(root, 'src/content/cv', `${lang}.yaml`);

const PRESENT = { en: 'Present', ru: 'н.в.' };

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Text extraction ───────────────────────────────────────────────────────────

async function extractText(filePath) {
  const buffer = fs.readFileSync(filePath);
  // mergePages: true — single string with newlines between pages
  const { text } = await pdfExtractText(new Uint8Array(buffer), { mergePages: true });
  const raw = Array.isArray(text) ? text.join('\n') : text;

  // LinkedIn PDF export sometimes contains soft-hyphen/zero-width garbage (e.g. "alexander￾gusarov...")
  const sanitized = raw
    .replace(/￾/g, '')
    .replace(/[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g, '');

  // Heal common broken URLs where PDF text inserts spaces/newlines in the middle of the URL.
  // Example: "www.linkedin.com/in/alexander- gusarov-..." -> "www.linkedin.com/in/alexander-gusarov-..."
  const healed = sanitized
    .replace(/((?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9-]+)\s+([A-Za-z0-9-]+)/g, '$1$2')
    .replace(/((?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9-]+)\s+([A-Za-z0-9-]+)/g, '$1$2')
    .replace(/([A-Za-z0-9.-]+\.tilda\.ws)\s+([A-Za-z0-9-]+)/g, '$1$2');

  // unpdf joins items with spaces — inject newlines before known LinkedIn patterns
  return healed
    .replace(/Page \d+ of \d+/g, '')
    // newline before section headers
    .replace(/\s+(Summary|Experience|Education|Skills|Top Skills|Languages|Certifications|Projects|Recommendations|Honors & Awards|Volunteer Experience)\s+/gi, '\n$1\n')
    // newline before month+year date patterns
    .replace(/\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/g, '\n$1 $2')
    // LinkedIn exports often concatenate "<Country> <NextCompany> <NextRole>" on one line.
    // Split after common country tokens so the next company begins on a new line.
    .replace(/\b(Russia|Россия|United Kingdom)\b\s+([A-ZА-Я])/g, '$1\n$2')
    // collapse excessive spaces but keep text on the same line
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitSections(text) {
  const SECTION_HEADERS = [
    'Summary', 'Experience', 'Education', 'Skills', 'Top Skills', 'Languages',
    'Certifications', 'Courses', 'Projects', 'Honors & Awards',
    'Volunteer Experience', 'Publications', 'Recommendations',
  ];

  // Match headers at start of a line OR after a newline, even if followed by extra words.
  // Example: "Experience 10 years" or "Top Skills Software Infrastructure"
  const hdr = SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?:^|\n)(${hdr.join('|')})(?=\s|\n|$)`, 'gmi');

  const matches = [...String(text).matchAll(pattern)];
  const sections = {};

  if (!matches.length) {
    sections['__header__'] = String(text).trim();
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1];
    const start = (matches[i].index ?? 0) + (matches[i][0]?.length ?? 0);
    const end = matches[i + 1]?.index ?? text.length;

    // Slice and then remove the header token from the beginning of the slice.
    let body = String(text).slice(start, end);
    body = body.replace(new RegExp(`^\s*${name}\b(?:\s+.*)?\n?`, 'i'), '');
    sections[name] = body.trim();
  }

  sections['__header__'] = String(text).slice(0, matches[0].index ?? 0).trim();
  return sections;
}

function normalizeDate(raw) {
  if (!raw) return undefined;
  raw = raw.trim()
    .replace(/\(.*?\)/g, '')  // strip "(1 year 4 months)"
    .replace(/·.+$/,    '')   // strip "· 2 yrs"
    .trim();

  if (!raw || /present/i.test(raw)) return undefined;

  const monthYear = raw.match(/^(\w+)\s+(\d{4})$/);
  if (monthYear) {
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04',
      jun: '06', jul: '07', aug: '08',
      sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const m = months[monthYear[1].toLowerCase()];
    return m ? `${monthYear[2]}-${m}` : monthYear[2];
  }

  if (/^\d{4}$/.test(raw)) return raw;
  return raw;
}

function parseDateRange(raw) {
  if (!raw) return { startDate: undefined, endDate: undefined };
  // strip duration before splitting
  const clean = raw.replace(/\(.*?\)/g, '').trim();
  const parts  = clean.split(/\s*[–—-]\s*/);
  return {
    startDate: normalizeDate(parts[0]),
    endDate:   normalizeDate(parts[1]),
  };
}

// ── Section parsers ───────────────────────────────────────────────────────────

function parseHeader(text) {
  const raw = String(text);

  // Use only the prefix before Summary to avoid picking up "Software Developer February" etc from Experience.
  const prefix = raw.split(/\nSummary\n/i)[0] ?? raw;

  const rawLines = prefix
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const joined = rawLines.join('\n');

  const emailMatch = joined.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const email = emailMatch?.[0] ?? undefined;

  const profiles = [];

  const grabUrl = (re) => {
    const m = joined.match(re)?.[0];
    if (!m) return undefined;
    return m
      .replace(/\s+/g, '')
      .replace(/[)\]}>.,;:]+$/g, '')
      .replace(/^www\./i, 'https://www.');
  };

  const linkedinUrl = grabUrl(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s]+/i)
    ?? grabUrl(/(?:www\.)?linkedin\.com\/in\/[^\s]+/i);
  const githubUrl = grabUrl(/https?:\/\/(?:www\.)?github\.com\/[^\s]+/i)
    ?? grabUrl(/(?:www\.)?github\.com\/[^\s]+/i);
  const websiteUrl = grabUrl(/https?:\/\/[\w.-]+\.tilda\.ws[^\s]*/i)
    ?? grabUrl(/[\w.-]+\.tilda\.ws[^\s]*/i);

  if (linkedinUrl) profiles.push({ network: 'LinkedIn', url: linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}` });
  if (githubUrl) profiles.push({ network: 'GitHub', url: githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}` });
  if (websiteUrl) profiles.push({ network: 'Website', url: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}` });

  // Strip URLs/emails for name/label heuristics
  const headerText = rawLines
    .filter(l => !/[\w.+-]+@[\w.-]+\.\w+/.test(l))
    .filter(l => !/(https?:\/\/|www\.)/i.test(l))
    .filter(l => !/linkedin\.com|github\.com|tilda\.ws/i.test(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Find "Firstname Lastname" candidates and take the last one.
  const banned = new Set([
    'contact', 'summary', 'experience', 'education', 'skills', 'top skills', 'languages',
    'certifications', 'projects', 'recommendations', 'honors & awards', 'volunteer experience',
    'courses', 'publications'
  ]);

  const nameRe = /\b([A-Z][\p{L}.'-]{2,}\s+[A-Z][\p{L}.'-]{2,})\b/gu;
  let name = '';
  for (const m of headerText.matchAll(nameRe)) {
    const cand = m[1].trim();
    if (banned.has(cand.toLowerCase())) continue;
    name = cand;
  }

  // Label: try to derive from the same line that contains the name.
  let label = '';
  if (name) {
    const lineWithName = headerText;
    const idx = lineWithName.indexOf(name);
    if (idx >= 0) {
      const after = lineWithName.slice(idx + name.length).trim();
      // Your PDF has: "... Alexander Gusarov Software Engineer, DevOps, Game Developer Russia"
      // Remove trailing country/location tokens.
      const cleaned = after
        .replace(/\b(Russia|Россия|Moscow|Москва)\b.*$/i, '')
        .trim();

      // Keep label only if it's not a skills blob (too many words).
      if (cleaned && cleaned.split(/\s+/).length <= 10) {
        label = cleaned.replace(/^[-–—|]+\s*/, '').trim();
      }
    }
  }

  return { name, label, email, url: undefined, profiles };
}

function parseSummary(text) {
  return text.replace(/\n+/g, ' ').trim();
}

function parseExperience(text) {
  const lines = String(text)
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    // Drop footer artifacts
    .filter(l => !/^Page \d+ of \d+$/i.test(l));

  const entries = [];

  // Date line like: "December 2024 - November 2025 (1 year)" or "July 2022 - October 2023 (1 year 4 months)"
  const dateLineRe = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[–—-]\s*(?:Present|\w+\s+\d{4})/i;

  let i = 0;
  while (i < lines.length) {
    const company = lines[i];
    const position = lines[i + 1];

    // Find the next date line within the next few lines (LinkedIn sometimes inserts employment type).
    let dateIdx = -1;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      if (dateLineRe.test(lines[j])) {
        dateIdx = j;
        break;
      }
    }

    if (!company || !position || dateIdx === -1) {
      i += 1;
      continue;
    }

    const dateLine = lines[dateIdx];
    const { startDate, endDate } = parseDateRange(dateLine);

    // Location is usually the line after the date line
    const location = lines[dateIdx + 1];

    // LinkedIn export PDF usually has no bullet highlights; keep empty for now.
    entries.push({
      name: company,
      position,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(location ? { location } : {}),
    });

    // Advance: next record starts after location (or after date line if location missing)
    i = (location ? dateIdx + 2 : dateIdx + 1);
  }

  return entries;
}

function parseEducation(text) {
  const entries = [];
  const blocks  = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const institution = lines[0];
    const degreeLine  = lines[1] ?? '';
    const degreeParts = degreeLine.split(/[,·]/).map(p => p.trim());
    const studyType   = degreeParts[0] ?? '';
    const area        = degreeParts[1] ?? '';

    const dateLine  = lines.find(l => /\d{4}/.test(l)) ?? '';
    const { startDate, endDate } = parseDateRange(dateLine);

    entries.push({
      institution,
      ...(studyType ? { studyType } : {}),
      ...(area      ? { area }      : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate   ? { endDate }   : {}),
    });
  }

  return entries;
}

function parseSkills(text) {
  const lines = String(text)
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^Top Skills$/i.test(l));

  // Keep only short-ish lines that look like skill names; remove obvious noise.
  const keywords = [];
  const seen = new Set();

  for (const l of lines) {
    if (l.length < 2) continue;
    if (l.length > 40) continue; // avoid whole paragraphs
    if (/^[\d,]+$/.test(l)) continue;
    if (/^(contact|summary|experience|education|languages)$/i.test(l)) continue;
    if (/linkedin\.com|github\.com|tilda\.ws|@/i.test(l)) continue;

    const key = l.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(l);
  }

  if (!keywords.length) return [];
  return [{ name: 'Skills', keywords }];
}

function parseLanguages(text) {
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (lines[i]) result.push({ language: lines[i], fluency: lines[i + 1] ?? '' });
  }
  return result;
}

// ── JSON Resume → site YAML ───────────────────────────────────────────────────

function toSiteYaml(json) {
  const basics  = json.basics ?? {};
  const present = PRESENT[lang];

  return {
    name:    basics.name    ?? '',
    title:   basics.label   ?? '',
    summary: basics.summary ?? '',

    contacts: [
      basics.email && { label: 'Email', url: `mailto:${basics.email}` },
      basics.url   && { label: 'Website', url: basics.url },
      ...(basics.profiles ?? []).map(p => ({ label: p.network, url: p.url })),
    ].filter(Boolean),

    ...(json.x_achievements?.length ? { achievements: json.x_achievements } : {}),

    skills: (json.skills ?? []).map(s => ({
      group: s.name,
      items: s.keywords ?? [],
    })),

    experience: (json.work ?? []).map(w => ({
      company:     w.name,
      role:        w.position,
      period:      `${w.startDate ?? ''} — ${w.endDate ?? present}`,
      description: w.highlights ?? [],
      ...(w.keywords?.length ? { stack: w.keywords } : {}),
    })),

    education: (json.education ?? []).map(e => ({
      institution: e.institution,
      degree:      [e.studyType, e.area].filter(Boolean).join(' — '),
      period:      `${e.startDate ?? ''} — ${e.endDate ?? ''}`,
    })),

    languages: (json.languages ?? []).map(l => ({
      language: l.language,
      level:    l.fluency ?? '',
    })),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('⏳ Extracting text from PDF...');
  const text = await extractText(inputFile);

  try {
    fs.writeFileSync(path.join(root, 'docs', `debug_linkedin_full_${lang}.txt`), text, 'utf8');
  } catch {}
  try {
    fs.writeFileSync(path.join(root, 'docs', `debug_linkedin_header_${lang}.txt`), splitSections(text)['__header__'] ?? '', 'utf8');
  } catch {}

  if (!text?.trim()) {
    console.error('❌ Could not extract text. Make sure the PDF is not scanned/image-based.');
    process.exit(1);
  }

  console.log('⏳ Parsing sections...');
  const sections = splitSections(text);
  try {
    fs.writeFileSync(
      path.join(root, 'docs', `debug_linkedin_sections_${lang}.txt`),
      Object.keys(sections).sort().join('\n'),
      'utf8'
    );
  } catch {}
  const header   = parseHeader(text);

  const json = {
    basics: {
      name:    header.name,
      label:   header.label,
      ...(header.email           ? { email: header.email }       : {}),
      ...(header.url             ? { url: header.url }           : {}),
      summary: parseSummary(sections['Summary'] ?? ''),
      ...(header.profiles.length ? { profiles: header.profiles } : {}),
    },
    work:      parseExperience(sections['Experience'] ?? ''),
    education: parseEducation(sections['Education']   ?? ''),
    skills:    parseSkills(sections['Skills'] ?? sections['Top Skills'] ?? ''),
    languages: parseLanguages(sections['Languages']   ?? ''),
  };

  const yamlData = toSiteYaml(json);

  ensureDir(jsonOut);
  ensureDir(yamlOut);

  fs.writeFileSync(jsonOut, JSON.stringify(json, null, 2), 'utf8');
  fs.writeFileSync(yamlOut, YAML.stringify(yamlData), 'utf8');

  console.log(`✔ JSON written: ${jsonOut}`);
  console.log(`✔ YAML written: ${yamlOut}`);
  console.log(`\n⚠ Review the output — heuristic parser, manual cleanup may be needed.`);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});