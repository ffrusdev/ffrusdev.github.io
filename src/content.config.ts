// Content collections = your "database" of markdown files.
// Astro reads every .md file in these folders, checks its frontmatter
// against the schema below (typos get caught at build time), and gives
// you typed data in your pages via getCollection().
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/projects' }),
  schema: z.object({
    title: z.string(),
    role: z.string(),
    status: z.enum(['active', 'shipped', 'paused', 'day-job']),
    year: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99), // lower = shown first
    link: z.string().optional(), // Steam / itch / trailer URL
  }),
});

const devlog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/devlog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    project: z.string().optional(),
  }),
});

export const collections = { projects, devlog };
