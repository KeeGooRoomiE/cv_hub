import fs from 'node:fs';
import { parse } from 'yaml';

const pairs = [
  ['bhop-jump/bhop_jump_en.yaml', 'bhop-jump/bhop_jump_ru.yaml'],
  ['cv-hub/cv_hub_en.yaml', 'cv-hub/cv_hub_ru.yaml'],
  ['s-s-platformer/s_s_platformer_en.yaml', 's-s-platformer/s_s_platformer_ru.yaml'],
  ['wikinest/wikinest_en.yaml', 'wikinest/wikinest_ru.yaml'],
  ['wings-gms-online/wings_gms_online_en.yaml', 'wings-gms-online/wings_gms_online_ru.yaml'],
];

const base = 'public/media/projects/';

for (const [enPath, ruPath] of pairs) {
  const en = parse(fs.readFileSync(base + enPath, 'utf8'));
  const ru = parse(fs.readFileSync(base + ruPath, 'utf8'));
  const name = enPath.split('/')[0];
  console.log(`\n=== ${name} ===`);

  const enTypes = (en.blocks || []).map(b => b.type);
  const ruTypes = (ru.blocks || []).map(b => b.type);
  if (JSON.stringify(enTypes) !== JSON.stringify(ruTypes)) {
    console.log('  BLOCK TYPE SEQUENCE MISMATCH:');
    console.log('   EN:', enTypes.join(','));
    console.log('   RU:', ruTypes.join(','));
  } else {
    console.log(`  block sequence OK (${enTypes.length} blocks)`);
  }

  const enAnchors = (en.blocks || []).filter(b => b.anchor).map(b => b.anchor);
  const ruAnchors = (ru.blocks || []).filter(b => b.anchor).map(b => b.anchor);
  console.log('  EN anchors:', enAnchors.length ? enAnchors.join(',') : '(none)');
  console.log('  RU anchors:', ruAnchors.length ? ruAnchors.join(',') : '(none)');
  // duplicate anchor check within a page
  for (const [lang, anchors] of [['EN', enAnchors], ['RU', ruAnchors]]) {
    const dupes = anchors.filter((a, i) => anchors.indexOf(a) !== i);
    if (dupes.length) console.log(`  DUPLICATE ANCHOR in ${lang}:`, dupes);
  }
  if (JSON.stringify(enAnchors) !== JSON.stringify(ruAnchors)) {
    console.log('  ANCHOR SET MISMATCH between EN/RU');
  }

  const enLinks = (en.links || []).map(l => l.label);
  const ruLinks = (ru.links || []).map(l => l.label);
  console.log(`  top links: EN=${enLinks.length} RU=${ruLinks.length}`, enLinks.length !== ruLinks.length ? '  <-- MISMATCH' : '');

  // video/code block field checks
  for (const [lang, doc] of [['EN', en], ['RU', ru]]) {
    for (const b of (doc.blocks || [])) {
      if (b.type === 'video' && !b.src) console.log(`  ${lang}: video block missing src`);
      if (b.type === 'code' && !b.body) console.log(`  ${lang}: code block missing body`);
      if (b.type === 'image' && !b.src) console.log(`  ${lang}: image block missing src`);
    }
  }
}
