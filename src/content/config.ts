import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const books = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    marketplace: z.boolean().optional().default(false),
    genres: z.array(z.string()).max(3),
    displayOrder: z.number().optional(),
    logline: z.string().optional(),
    shortDescription: z.string(),
    mediumDescription: z.string().optional(),
    series: z.string().optional(),
    seriesSubtitle: z.string().optional(),
    seriesDescription: z.string().optional(),
    readingOrder: z.array(z.object({
      title: z.string(),
      labels: z.array(z.string()).max(3).optional(),
    })).optional(),
    readingMap: z.object({ label: z.string(), url: z.string() }).optional(),
    cardsFolder: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).optional().default([]),
    world: z.string().optional(),
    characters: z.array(z.object({
      name: z.string(),
      role: z.string(),
      description: z.string(),
      photo: z.string().optional(),
    })).optional(),
    charactersFolder: z.string().optional(),
    extraLinks: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
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
    reviews: z.array(z.object({
      text: z.string(),
      author: z.string(),
    })).optional(),
  }),
});

const lore = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    book: z.string(),
    excerpt: z.string(),
    date: z.date(),
    cover: z.string().optional(),
    order: z.number().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().optional().default(false),
  }),
});

const authors = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
  }),
});

const paths = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    cover: z.string(),
    order: z.number().optional(),
    books: z.array(z.string()).default([]),
    featured: z.array(z.object({
      book: z.string(),
      text: z.string().optional(),
    })).default([]),
    gallery: z.string().optional(),
    cards: z.string().optional(),
  }),
});

export const collections = { books, blog, lore, authors, paths };
