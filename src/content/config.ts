import { defineCollection, z } from "astro:content";

const books = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    marketplace: z.boolean().optional().default(false),
    genres: z.array(z.string()).max(3),
    logline: z.string().optional(),
    shortDescription: z.string(),
    mediumDescription: z.string().optional(),
    series: z.string().optional(),
    seriesDescription: z.string().optional(),
    seriesOrder: z.number().optional(),
    readingOrder: z.array(z.object({
      title: z.string(),
      labels: z.array(z.string()).max(3).optional(),
    })).optional(),
    readingMap: z.object({ label: z.string(), url: z.string() }).optional(),
    seriesLinks: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional().default([]),
    world: z.string().optional(),
    worldMaps: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    characters: z.array(z.object({
      name: z.string(),
      role: z.string(),
      description: z.string(),
      photo: z.string().optional(),
    })).optional(),
    charactersFolder: z.string().optional(),
    characterMaps: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    books: z.array(z.object({
      title: z.string(),
      cover: z.string(),
      marketplace: z.boolean().optional().default(false),
      genres: z.array(z.string()).max(3).optional(),
      logline: z.string().optional(),
      shortDescription: z.string().optional(),
      description: z.string().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() })).optional().default([]),
    })).optional(),
    booktrailer: z.object({
      visible: z.boolean().optional().default(true),
      file: z.string(),
      orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
    }).optional(),
  }),
});

export const collections = { books };
