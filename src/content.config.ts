import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// "Easy to edit later" core (BUILD-SPEC.md §1, §4): adding a project later is
// just dropping a new .md file into src/content/projects/.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    emoji: z.string(), // e.g. "🌵" — tile marker until custom pixel icons exist
    summary: z.string(), // one-line for the tile
    tags: z.array(z.string()), // e.g. ["AI", "Automation", "Product"]
    status: z.enum(['live', 'ongoing', 'archived', 'case-study']),
    order: z.number(), // controls tile ordering
    date: z.coerce.date(),
    cover: z.string().optional(), // optional image path
    images: z.array(z.string()).optional(), // in-page screenshots (public/work/…)
  }),
});

export const collections = { projects };
