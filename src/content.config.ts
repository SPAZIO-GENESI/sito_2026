import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Collezione "news": post Markdown in src/content/news/*.md
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
})

// Collezione "comunicazioni": log delle comunicazioni istituzionali dell'associazione
// (assemblee in presenza, call online, avvisi) — sezione "Vita associativa" del Diario.
const comunicazioni = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comunicazioni' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    // modalità dell'evento/comunicazione
    modalita: z.enum(['presenza', 'online', 'mista', 'comunicazione']).default('comunicazione'),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
})

export const collections = { news, comunicazioni }
