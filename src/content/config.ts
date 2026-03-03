//
//  config.ts
//  CV Hub
//
//  Created by Alexander Gusarov on 03.03.2026.
//  @spartan121
//

import { defineCollection, z } from 'astro:content';

/**
 * NOTE:
 * We validate content shape here, not presentation.
 * Keep schemas permissive enough for real-world resume data (e.g. mailto: links).
 */

const linkSchema = z.object({
  label: z.string().optional().default(''),
  // allow https://, http:// and mailto: (only validate when provided)
  url: z
    .string()
    .optional()
    .default('')
    .refine(
      (v) =>
        v === '' || v.startsWith('https://') || v.startsWith('http://') || v.startsWith('mailto:'),
      { message: 'url must start with https://, http://, or mailto:' }
    ),
});

const cvSkillGroupSchema = z.object({
  group: z.string().optional().default(''),
  items: z.array(z.string()).optional().default([]),
});

const cvExperienceSchema = z.object({
  company: z.string().optional().default(''),
  role: z.string().optional().default(''),
  period: z.string().optional().default(''),
  description: z.array(z.string()).optional().default([]),
  stack: z.array(z.string()).optional().default([]),
});

const cvEducationSchema = z.object({
  institution: z.string().optional().default(''),
  degree: z.string().optional().default(''),
  period: z.string().optional().default(''),
});

const cvLanguageSchema = z.object({
  language: z.string().optional().default(''),
  level: z.string().optional().default(''),
});

const cv = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string().optional().default(''),
    title: z.string().optional().default(''),
    summary: z.string().optional().default(''),

    contacts: z.array(linkSchema).optional().default([]),

    achievements: z.array(z.string()).optional().default([]),

    skills: z.array(cvSkillGroupSchema).optional().default([]),

    experience: z.array(cvExperienceSchema).optional().default([]),

    education: z.array(cvEducationSchema).optional().default([]),

    languages: z.array(cvLanguageSchema).optional().default([]),

    location: z.string().optional().default(''),
    timezone: z.string().optional().default(''),
    work_permit: z.string().optional().default(''),
  }),
});

// Showcase
const showcaseLinkSchema = z.object({
  label: z.string().optional().default(''),
  url: z.string().optional().default(''),
  type: z
    .enum(['repo', 'demo', 'store', 'product', 'video', 'article', 'press', 'other'])
    .optional()
    .default('other'),
});

const showcaseMetricSchema = z.object({
  label: z.string().optional().default(''),
  value: z.string().optional().default(''),
  source: z.string().optional().default(''),
});

const showcaseMediaSchema = z.object({
  type: z.enum(['image', 'gif', 'video']).optional().default('image'),
  src: z.string().optional().default(''),
  alt: z.string().optional().default(''),
  featured: z.boolean().optional().default(false),
});

const showcaseProjectSchema = z.object({
  slug: z.string().optional().default(''),
  name: z.string().optional().default(''),

  // Sorting priority (lower shows earlier). Accepts number or numeric string.
  order: z.coerce.number().optional(),

  category: z.string().optional().default(''),
  role: z.string().optional().default(''),

  // Accept string/number/undefined and always store as string
  year: z.preprocess(
    (v) => (v === undefined || v === null ? '' : String(v)),
    z.string().optional().default('')
  ),

  description: z.string().optional().default(''),

  platforms: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),

  theme: z
    .enum(['auto', 'blue', 'purple', 'amber', 'emerald', 'red', 'slate'])
    .optional()
    .default('auto'),

  accent: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'accent must be a HEX color like #3b82f6')
    .optional(),

  metrics: z.array(showcaseMetricSchema).optional().default([]),

  stack: z.array(z.string()).optional().default([]),
  links: z.array(showcaseLinkSchema).optional().default([]),

  // media can be missing entirely or be an empty list
  media: z.array(showcaseMediaSchema).optional().default([]),

  featured: z.boolean().optional().default(false),
});

const showcase = defineCollection({
  type: 'data',
  schema: z.object({
    projects: z.array(showcaseProjectSchema).optional().default([]),
  }),
});

export const collections = {
  cv,
  showcase,
};