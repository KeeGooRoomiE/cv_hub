/**
 *  generate-resume.js
 *  CV Hub
 *
 *  Reads cv/en.yaml and cv/ru.yaml, generates:
 *    public/downloads/resume_en.txt
 *    public/downloads/resume_ru.txt
 *    public/downloads/resume_en.docx
 *    public/downloads/resume_ru.docx
 *
 *  Run: node scripts/generate-resume.js
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle,
} from 'docx';

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT       = path.resolve('.');
const CONTENT    = path.join(ROOT, 'src/content/cv');
const OUTPUT_DIR = path.join(ROOT, 'public/downloads');

const FILES = [
  { yaml: 'en.yaml', suffix: 'en' },
  { yaml: 'ru.yaml', suffix: 'ru' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadYaml(filename) {
  const raw = fs.readFileSync(path.join(CONTENT, filename), 'utf8');
  return parse(raw);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function stripUrl(url = '') {
  return url.replace(/^mailto:/, '');
}

// ── TXT ───────────────────────────────────────────────────────────────────────

function generateTxt(cv) {
  const lines = [];
  const hr = '\u2500'.repeat(60);

  lines.push(cv.name);
  lines.push(cv.title);
  lines.push('');

  if (cv.summary) {
    lines.push(cv.summary.trim());
    lines.push('');
  }

  if (cv.contacts?.length) {
    lines.push(hr);
    lines.push('CONTACTS');
    lines.push(hr);
    for (const c of cv.contacts) lines.push(`${c.label}: ${stripUrl(c.url)}`);
    lines.push('');
  }

  if (cv.achievements?.length) {
    lines.push(hr);
    lines.push('KEY ACHIEVEMENTS');
    lines.push(hr);
    for (const a of cv.achievements) lines.push(`\u2022 ${a}`);
    lines.push('');
  }

  if (cv.skills?.length) {
    lines.push(hr);
    lines.push('SKILLS');
    lines.push(hr);
    for (const s of cv.skills) lines.push(`${s.group}: ${s.items.join(', ')}`);
    lines.push('');
  }

  if (cv.experience?.length) {
    lines.push(hr);
    lines.push('EXPERIENCE');
    lines.push(hr);
    for (const exp of cv.experience) {
      lines.push(`${exp.company} \u2014 ${exp.role}`);
      lines.push(exp.period);
      if (Array.isArray(exp.description)) {
        for (const d of exp.description) lines.push(`  \u2022 ${d}`);
      } else {
        lines.push(`  ${exp.description}`);
      }
      if (exp.stack?.length) lines.push(`  Stack: ${exp.stack.join(', ')}`);
      lines.push('');
    }
  }

  if (cv.education?.length) {
    lines.push(hr);
    lines.push('EDUCATION');
    lines.push(hr);
    for (const e of cv.education) lines.push(`${e.institution} \u2014 ${e.degree} (${e.period})`);
    lines.push('');
  }

  if (cv.languages?.length) {
    lines.push(hr);
    lines.push('LANGUAGES');
    lines.push(hr);
    for (const l of cv.languages) lines.push(`${l.language}: ${l.level}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 80 },
  });
}

function heading(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '3b82f6', space: 4 },
    },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function generateDocx(cv) {
  const children = [];

  // Name & Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cv.name, bold: true, size: 48 })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: cv.title, size: 28, color: '3b82f6' })],
      spacing: { after: 160 },
    }),
  );

  // Summary
  if (cv.summary) {
    children.push(heading('Summary'), p(cv.summary.trim()), p(''));
  }

  // Contacts
  if (cv.contacts?.length) {
    children.push(heading('Contacts'));
    for (const c of cv.contacts) children.push(p(`${c.label}: ${stripUrl(c.url)}`));
    children.push(p(''));
  }

  // Achievements
  if (cv.achievements?.length) {
    children.push(heading('Key Achievements'));
    for (const a of cv.achievements) children.push(bullet(a));
    children.push(p(''));
  }

  // Skills
  if (cv.skills?.length) {
    children.push(heading('Skills'));
    for (const s of cv.skills) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${s.group}: `, bold: true }),
            new TextRun({ text: s.items.join(', ') }),
          ],
          spacing: { after: 60 },
        }),
      );
    }
    children.push(p(''));
  }

  // Experience
  if (cv.experience?.length) {
    children.push(heading('Experience'));
    for (const exp of cv.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.company} \u2014 `, bold: true, size: 26 }),
            new TextRun({ text: exp.role, size: 26 }),
          ],
          spacing: { before: 160, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: exp.period, color: '6b7280', italics: true })],
          spacing: { after: 60 },
        }),
      );

      if (Array.isArray(exp.description)) {
        for (const d of exp.description) children.push(bullet(d));
      } else {
        children.push(p(exp.description));
      }

      if (exp.stack?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Stack: ', bold: true }),
              new TextRun({ text: exp.stack.join(', '), color: '3b82f6' }),
            ],
            spacing: { before: 40, after: 120 },
          }),
        );
      }
    }
  }

  // Education
  if (cv.education?.length) {
    children.push(heading('Education'));
    for (const e of cv.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: e.institution, bold: true }),
            new TextRun({ text: ` \u2014 ${e.degree}` }),
            new TextRun({ text: `  (${e.period})`, color: '6b7280', italics: true }),
          ],
          spacing: { after: 80 },
        }),
      );
    }
    children.push(p(''));
  }

  // Languages
  if (cv.languages?.length) {
    children.push(heading('Languages'));
    for (const l of cv.languages) children.push(p(`${l.language}: ${l.level}`));
  }

  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [{ children }],
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir(OUTPUT_DIR);

  for (const { yaml, suffix } of FILES) {
    const cv = loadYaml(yaml);

    const txt = generateTxt(cv);
    const txtPath = path.join(OUTPUT_DIR, `resume_${suffix}.txt`);
    fs.writeFileSync(txtPath, txt, 'utf8');
    console.log(`\u2713 ${txtPath}`);

    const doc = generateDocx(cv);
    const buffer = await Packer.toBuffer(doc);
    const docxPath = path.join(OUTPUT_DIR, `resume_${suffix}.docx`);
    fs.writeFileSync(docxPath, buffer);
    console.log(`\u2713 ${docxPath}`);
  }

  console.log('\nDone. Files written to public/downloads/');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});