/**
 * resume-export-pdf.mjs
 *
 * Reads src/content/cv/en.yaml and ru.yaml,
 * builds a clean two-column print HTML and exports PDF via Playwright.
 *
 * Usage:
 *   npm run resume:pdf
 *
 * Output:
 *   public/downloads/resume_en.pdf
 *   public/downloads/resume_ru.pdf
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const ROOT       = path.resolve('.');
const CONTENT    = path.join(ROOT, 'src/content/cv');
const OUTPUT_DIR = path.join(ROOT, 'public/downloads');

const FILES = [
  { yaml: 'en.yaml', suffix: 'en' },
  { yaml: 'ru.yaml', suffix: 'ru' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadYaml(filename) {
  const raw = fs.readFileSync(path.join(CONTENT, filename), 'utf8');
  return parse(raw);
}

function cleanPeriod(period = '') {
  return period
    .replace(/—\s*undefined/g, '')
    .replace(/—\s*$/,          '')
    .trim();
}

function html(cv, lang = 'en') {
  const T = {
    en: {
      about:        'About me',
      achievements: 'Key Achievements',
      skills:       'Skills',
      experience:   'Experience',
      education:    'Education',
      languages:    'Languages',
    },
    ru: {
      about:        'Обо мне',
      achievements: 'Ключевые достижения',
      skills:       'Навыки',
      experience:   'Опыт',
      education:    'Образование',
      languages:    'Языки',
    },
  };

  const tr = T[lang] ?? T.en;

  /* ── Contacts: label as clickable link, URL hidden ── */
  const contactsHtml = (cv.contacts ?? [])
    .map(c => `<div class="contact-row"><a href="${c.url}">${c.label}</a></div>`)
    .join('');

  /* ── Education ── */
  const educationHtml = (cv.education ?? []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-divider"></div>
      <h3>${tr.education}</h3>
      ${(cv.education ?? []).map(e => `
        <div class="edu-item">
          <div class="edu-institution">${e.institution}</div>
          ${e.period ? `<div class="edu-period">${e.period}</div>` : ''}
          ${e.degree ? `<div class="edu-degree">${e.degree}</div>` : ''}
          ${e.field  ? `<div class="edu-field">${e.field}</div>`   : ''}
        </div>
      `).join('')}
    </div>` : '';

  /* ── Skills ── */
  const skillsHtml = (cv.skills ?? []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-divider"></div>
      <h3>${tr.skills}</h3>
      ${(cv.skills ?? []).map(s => {
        const groupName = typeof s === 'string' ? null : (s.group ?? null);
        const items = typeof s === 'string' ? [s] : (s.items ?? []);
        return `
        <div class="skill-group-block">
          ${groupName ? `<div class="skill-group-name">${groupName}</div>` : ''}
          <div class="skill-items">${items.join(' · ')}</div>
        </div>`;
      }).join('')}
    </div>` : '';

  /* ── Languages ── */
  const languagesHtml = (cv.languages ?? []).length ? `
    <div class="sidebar-section">
      <div class="sidebar-divider"></div>
      <h3>${tr.languages}</h3>
      ${(cv.languages ?? []).map(l => `
        <div class="lang-row">
          <div class="lang-name">${l.language}</div>
          <div class="lang-level">${l.level}</div>
        </div>
      `).join('')}
    </div>` : '';

  /* ── About / Summary ── */
  const aboutHtml = cv.summary ? `
    <section class="content-section">
      <h2>${tr.about}</h2>
      <p class="summary-text">${cv.summary}</p>
    </section>` : '';

  /* ── Achievements ── */
  const achievementsHtml = (cv.achievements ?? []).length ? `
    <section class="content-section">
      <h2>${tr.achievements}</h2>
      <ul class="bullets">
        ${(cv.achievements ?? []).map(a => `<li>${a}</li>`).join('')}
      </ul>
    </section>` : '';

  /* ── Experience ── */
  const experienceHtml = (cv.experience ?? []).length ? `
    <section class="content-section">
      <h2>${tr.experience}</h2>
      ${(cv.experience ?? []).map(exp => {
        const desc = Array.isArray(exp.description) ? exp.description.filter(Boolean) : [];
        return `
        <div class="exp-entry">
          <div class="exp-lead">
            <div class="exp-header">
              <div class="exp-company">${exp.company}${exp.role ? ` <span class="exp-role">— ${exp.role}</span>` : ''}</div>
              <div class="exp-period">${cleanPeriod(exp.period)}</div>
            </div>
          </div>
          ${desc.length ? `<ul class="bullets">${desc.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
          ${exp.stack?.length ? `<div class="exp-stack">${exp.stack.join(', ')}</div>` : ''}
        </div>`;
      }).join('')}
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --accent:     #1F439B;
      --text:       #1a1a1a;
      --muted:      #555555;
      --light:      #888888;
      --sidebar-bg: #F5F5F5;
      --divider:    #1a1a1a;
    }

    html, body {
      width: 210mm;
      height: 297mm;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: 400;
      color: var(--text);
      background: #fff;
      display: grid;
      grid-template-columns: 66mm 1fr;
      line-height: 1.5;
    }

    a { color: inherit; text-decoration: none; }

    /* ─────────────────────────────────────────
       SIDEBAR
       ───────────────────────────────────────── */
    .sidebar {
      background: var(--sidebar-bg);
      padding: 13mm 7mm 13mm 8mm;
      display: flex;
      flex-direction: column;
    }

    .cv-name {
      font-size: 18pt;
      font-weight: 600;
      line-height: 1.15;
      color: var(--text);
      margin-bottom: 3px;
    }

    /* General role — black, lighter weight */
    .cv-title {
      font-size: 9.5pt;
      font-weight: 400;
      color: var(--text);
      margin-bottom: 12px;
      line-height: 1.4;
    }

    /* Contacts: label only as link */
    .contact-row {
      margin-bottom: 3px;
      font-size: 8.5pt;
    }

    .contact-row a {
      color: var(--accent);
      font-weight: 500;
    }

    /* Sidebar sections */
    .sidebar-section { margin-top: 2px; }

    .sidebar-divider {
      border: none;
      border-top: 1px solid #d0d0d0;
      margin: 10px 0 8px;
    }

    .sidebar-section h3 {
      font-size: 8.5pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text);
      margin-bottom: 7px;
    }

    /* Education */
    .edu-item { margin-bottom: 8px; }

    .edu-institution {
      font-weight: 600;
      color: var(--accent);
      font-size: 8.5pt;
    }

    .edu-period {
      font-size: 8pt;
      color: var(--light);
    }

    .edu-degree, .edu-field {
      font-size: 8.5pt;
      color: var(--muted);
    }

    /* Skills */
    .skill-group-block { margin-bottom: 7px; }

    .skill-group-name {
      font-weight: 600;
      color: var(--accent);
      font-size: 8.5pt;
      margin-bottom: 1px;
    }

    .skill-items {
      font-size: 8.5pt;
      color: var(--muted);
      line-height: 1.55;
    }

    /* Languages — stacked, not side-by-side */
    .lang-row {
      margin-bottom: 5px;
    }

    .lang-name {
      font-weight: 600;
      font-size: 8.5pt;
      color: var(--text);
    }

    .lang-level {
      font-size: 8pt;
      color: var(--muted);
    }

    /* ─────────────────────────────────────────
       MAIN CONTENT
       ───────────────────────────────────────── */
    .content {
      padding: 13mm 10mm 13mm 10mm;
      display: flex;
      flex-direction: column;
    }

    .content-section { margin-bottom: 13px; }

    /* Section titles — bigger, black, thicker divider */
    .content-section h2 {
      font-size: 13pt;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 2px solid var(--divider);
    }

    /* Summary */
    .summary-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.6;
    }

    /* Experience */
    .exp-entry { margin-bottom: 11px; }

    /* Only header stays glued to first bullet on page break */
    .exp-lead { break-inside: avoid; }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 3px;
    }

    .exp-company {
      font-size: 10pt;
      font-weight: 600;
      color: var(--accent);
      flex: 1;
    }

    /* Role — same color as company */
    .exp-role {
      font-weight: 400;
      color: var(--accent);
      font-size: 9.5pt;
    }

    .exp-period {
      font-size: 8.5pt;
      color: var(--light);
      white-space: nowrap;
    }

    /* Stack — indented to align with bullet text, not bullet marker */
    .exp-stack {
      font-size: 8pt;
      color: var(--light);
      margin-top: 3px;
      padding-left: 13px;
      font-style: italic;
    }

    /* Bullets */
    .bullets {
      padding-left: 13px;
      margin: 3px 0;
    }

    .bullets li {
      font-size: 9pt;
      color: #333;
      margin-bottom: 2px;
      line-height: 1.5;
    }

    .bullets li::marker {
      color: var(--accent);
      font-size: 8pt;
    }
  </style>
</head>
<body>

  <!-- SIDEBAR -->
  <div class="sidebar">
    <div class="cv-name">${cv.name ?? ''}</div>
    <div class="cv-title">${cv.title ?? ''}</div>

    ${contactsHtml}
    ${educationHtml}
    ${skillsHtml}
    ${languagesHtml}
  </div>

  <!-- CONTENT -->
  <div class="content">
    ${aboutHtml}
    ${achievementsHtml}
    ${experienceHtml}
  </div>

</body>
</html>`;
}

async function run() {
  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  for (const { yaml, suffix } of FILES) {
    const cv      = loadYaml(yaml);
    const content = html(cv, suffix);

    await page.setContent(content, { waitUntil: 'networkidle' });

    const outPath = path.join(OUTPUT_DIR, `resume_${suffix}.pdf`);

    await page.pdf({
      path:            outPath,
      format:          'A4',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    });

    console.log(`✔ ${outPath}`);
  }

  await browser.close();
  console.log('\nDone.');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
