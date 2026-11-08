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
    // Which shelf it sits on in CH01: '3d' (3D + multiplayer games), '2d', or 'work' (day job)
    section: z.enum(['3d', '2d', 'work']),
    year: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99), // lower = shown first
    link: z.string().optional(), // Steam / itch / trailer URL
  }),
});

// VR / MR / AR projects. Separate from `projects` because XR work needs a few
// extra fields: which headset it runs on, and a video (visitors can't put on
// a headset through a web page, so the video IS the demo).
const xr = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/xr' }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['VR', 'MR', 'AR']), // VR = fully virtual, MR = blends with your room, AR = phone/glasses overlay
    headset: z.string(), // e.g. "Meta Quest 3"
    role: z.string(),
    year: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99), // lower = shown first
    video: z.string().optional(), // YouTube link (gets embedded) or any video URL (shown as a link)
    link: z.string().optional(), // itch / Meta store / GitHub URL
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

export const collections = { projects, xr, devlog };
