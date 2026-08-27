//
//  inline-format.ts
//  CV Hub — shared inline-formatting helper for content blocks
//
//  Created by Alexander Gusarov on 27.08.2026.
//  @spartan121
//
//  Splits a plain string on `backtick`-delimited spans so a template can
//  render the backticked parts as real <code> elements instead of literal
//  backtick characters. No markdown engine, no set:html — just an array of
//  {code, text} segments the caller maps to text nodes / <code>. Safe by
//  construction: Astro auto-escapes plain string children, so this can
//  never inject markup from content data.
//

export type InlineSegment = { code: boolean; text: string };

export function parseInline(input: unknown): InlineSegment[] {
  const s = String(input ?? '');
  if (!s) return [];
  return s
    .split(/(`[^`]+`)/g)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 1
        ? { code: true, text: part.slice(1, -1) }
        : { code: false, text: part }
    );
}
