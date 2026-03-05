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
 *  Run: node .github/scripts/generate-resume.js
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import {
  Document, Packer, Paragraph, TextRun, BorderStyle,
  AlignmentType, LevelFormat, 
} from 'docx';

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT       = path.resolve('.');
const CONTENT    = path.join(ROOT, 'src/content/cv');
const OUTPUT_DIR = path.join(ROOT, 'public/downloads');

const FILES = [
  { yaml: 'en.yaml', suffix: 'en' },
  { yaml: 'ru.yaml', suffix: 'ru' },
];

const BULLETS_REF = 'resume-bullets';

// ── Colors ────────────────────────────────────────────────────────────────────

const ACCENT = '1F439B';
const TEXT   = '1a1a1a';
const MUTED  = '555555';
const LIGHT  = '888888';

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadYaml(filename) {
  const raw = fs.readFileSync(path.join(CONTENT, filename), 'utf8');
  return parse(raw);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanPeriod(period = '') {
  return (period ?? '')
    .replace(/—\s*undefined/g, '')
    .replace(/—\s*$/, '')
    .trim();
}

// ── TXT ───────────────────────────────────────────────────────────────────────

function generateTxt(cv, lang = 'en') {
  const T = {
    en: { achievements: 'KEY ACHIEVEMENTS', skills: 'SKILLS', experience: 'EXPERIENCE', education: 'EDUCATION', languages: 'LANGUAGES', contacts: 'CONTACTS', about: 'ABOUT' },
    ru: { achievements: 'КЛЮЧЕВЫЕ ДОСТИЖЕНИЯ', skills: 'НАВЫКИ', experience: 'ОПЫТ', education: 'ОБРАЗОВАНИЕ', languages: 'ЯЗЫКИ', contacts: 'КОНТАКТЫ', about: 'О СЕБЕ' },
  };
  const tr = T[lang] ?? T.en;

  const lines = [];
  const hr = '─'.repeat(60);

  lines.push(cv.name ?? '');
  lines.push(cv.title ?? '');
  lines.push('');

  if (cv.summary) { lines.push(cv.summary.trim()); lines.push(''); }

  if (cv.contacts?.length) {
    lines.push(hr); lines.push(tr.contacts); lines.push(hr);
    for (const c of cv.contacts) lines.push(c.label);
    lines.push('');
  }

  if (cv.achievements?.length) {
    lines.push(hr); lines.push(tr.achievements); lines.push(hr);
    for (const a of cv.achievements) lines.push(`• ${a}`);
    lines.push('');
  }

  if (cv.skills?.length) {
    lines.push(hr); lines.push(tr.skills); lines.push(hr);
    for (const s of cv.skills) {
      const group = typeof s === 'string' ? null : s.group;
      const items = typeof s === 'string' ? [s] : (s.items ?? []);
      lines.push(group ? `${group}: ${items.join(', ')}` : items.join(', '));
    }
    lines.push('');
  }

  if (cv.experience?.length) {
    lines.push(hr); lines.push(tr.experience); lines.push(hr);
    for (const exp of cv.experience) {
      lines.push(`${exp.company}${exp.role ? ` — ${exp.role}` : ''}`);
      lines.push(cleanPeriod(exp.period));
      if (Array.isArray(exp.description)) {
        for (const d of exp.description) lines.push(`  • ${d}`);
      }
      if (exp.stack?.length) lines.push(`  ${exp.stack.join(', ')}`);
      lines.push('');
    }
  }

  if (cv.education?.length) {
    lines.push(hr); lines.push(tr.education); lines.push(hr);
    for (const e of cv.education) lines.push(`${e.institution}${e.degree ? ` — ${e.degree}` : ''}${e.period ? ` (${e.period})` : ''}`);
    lines.push('');
  }

  if (cv.languages?.length) {
    lines.push(hr); lines.push(tr.languages); lines.push(hr);
    for (const l of cv.languages) lines.push(`${l.language}: ${l.level}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── DOCX builders ─────────────────────────────────────────────────────────────

// Section heading: large, bold, black, thick black bottom border
function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 30, color: TEXT })],
    spacing: { before: 280, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: TEXT, space: 4 },
    },
  });
}

// Plain paragraph
function p(runs, spacingAfter = 80) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 20, color: TEXT })];
  return new Paragraph({ children, spacing: { after: spacingAfter } });
}

// Bullet item
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: MUTED })],
    numbering: { reference: BULLETS_REF, level: 0 },
    spacing: { after: 40 },
  });
}

function generateDocx(cv, lang = 'en') {
  const T = {
    en: { about: 'About', achievements: 'Key Achievements', skills: 'Skills', experience: 'Experience', education: 'Education', languages: 'Languages' },
    ru: { about: 'О себе', achievements: 'Ключевые достижения', skills: 'Навыки', experience: 'Опыт', education: 'Образование', languages: 'Языки' },
  };
  const tr = T[lang] ?? T.en;

  const children = [];

  // ── Name ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cv.name ?? '', bold: true, size: 52, color: TEXT })],
      spacing: { after: 60 },
    }),
  );

  // ── Title — black, normal weight ──
  if (cv.title) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cv.title, size: 24, color: TEXT })],
        spacing: { after: 160 },
      }),
    );
  }

  // ── Contacts — label only ──
  if (cv.contacts?.length) {
    for (const c of cv.contacts) {
      const display = c.url
        .replace(/^mailto:/, '')
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/\/$/, '');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: c.label, bold: true, size: 20, color: TEXT }),
            new TextRun({ text: '  —  ', size: 20, color: LIGHT }),
            new TextRun({ text: display, size: 20, color: MUTED }),
          ],
          spacing: { after: 40 },
        }),
      );
    }
    children.push(p('', 120));
  }

  // ── About ──
  if (cv.summary) {
    children.push(heading(tr.about));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: cv.summary.trim(), size: 20, color: MUTED })],
        spacing: { after: 80 },
      }),
    );
  }

  // ── Achievements ──
  if (cv.achievements?.length) {
    children.push(heading(tr.achievements));
    for (const a of cv.achievements) children.push(bullet(a));
    children.push(p('', 80));
  }

  // ── Skills ──
  if (cv.skills?.length) {
    children.push(heading(tr.skills));
    for (const s of cv.skills) {
      const groupName = typeof s === 'string' ? null : (s.group ?? null);
      const items     = typeof s === 'string' ? [s] : (s.items ?? []);
      children.push(
        new Paragraph({
          children: [
            ...(groupName ? [new TextRun({ text: `${groupName}: `, bold: true, size: 20, color: ACCENT })] : []),
            new TextRun({ text: items.join(', '), size: 20, color: MUTED }),
          ],
          spacing: { after: 60 },
        }),
      );
    }
    children.push(p('', 80));
  }

  // ── Experience ──
  if (cv.experience?.length) {
    children.push(heading(tr.experience));
    for (const exp of cv.experience) {
      // Company — role (both accent color)
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.company ?? '', bold: true, size: 24, color: ACCENT }),
            ...(exp.role ? [new TextRun({ text: ` — ${exp.role}`, size: 22, color: ACCENT })] : []),
          ],
          spacing: { before: 160, after: 40 },
        }),
      );

      // Period
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanPeriod(exp.period), size: 19, color: LIGHT, italics: true })],
          spacing: { after: 60 },
        }),
      );

      // Bullets
      if (Array.isArray(exp.description)) {
        for (const d of exp.description) children.push(bullet(d));
      }

      // Stack — indented, italic, light
      if (exp.stack?.length) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: exp.stack.join(', '), size: 18, color: LIGHT, italics: true })],
            indent: { left: 360 },
            spacing: { before: 40, after: 120 },
          }),
        );
      }
    }
  }

  // ── Education ──
  if (cv.education?.length) {
    children.push(heading(tr.education));
    for (const e of cv.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: e.institution ?? '', bold: true, size: 22, color: ACCENT }),
            ...(e.degree ? [new TextRun({ text: ` — ${e.degree}`, size: 20, color: TEXT })] : []),
          ],
          spacing: { after: 40 },
        }),
      );
      if (e.period) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: e.period, size: 19, color: LIGHT, italics: true })],
            spacing: { after: 60 },
          }),
        );
      }
    }
    children.push(p('', 80));
  }

  // ── Languages ──
  if (cv.languages?.length) {
    children.push(heading(tr.languages));
    for (const l of cv.languages) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: l.language ?? '', bold: true, size: 20, color: TEXT }),
          ],
          spacing: { after: 20 },
        }),
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: l.level ?? '', size: 19, color: MUTED })],
          spacing: { after: 60 },
        }),
      );
    }
  }

  return new Document({
    numbering: {
      config: [
        {
          reference: BULLETS_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 400, hanging: 200 },
                },
                run: { color: ACCENT },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: TEXT },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 900, right: 900, bottom: 900, left: 900 },
        },
      },
      children,
    }],
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  ensureDir(OUTPUT_DIR);

  for (const { yaml, suffix } of FILES) {
    const cv = loadYaml(yaml);

    const txt = generateTxt(cv, suffix);
    const txtPath = path.join(OUTPUT_DIR, `resume_${suffix}.txt`);
    fs.writeFileSync(txtPath, txt, 'utf8');
    console.log(`✓ ${txtPath}`);

    const doc = generateDocx(cv, suffix);
    const buffer = await Packer.toBuffer(doc);
    const docxPath = path.join(OUTPUT_DIR, `resume_${suffix}.docx`);
    fs.writeFileSync(docxPath, buffer);
    console.log(`✓ ${docxPath}`);
  }

  console.log('\nDone. Files written to public/downloads/');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});