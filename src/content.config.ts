import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const locationSchema = z.object({
  type: z.enum(['geo']),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number()
})

const articleSchema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),

  // ? Optionals
  description: z.string().optional(),
  noPhotos: z.coerce.boolean().optional().default(false),
  summary: z.string().optional(),
  category: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public').optional(),
  'post-status': z.enum(['published']).default('published').optional(),
  location: locationSchema.optional(),
  updated: z.coerce.date().optional(),

  // ? Custom
  image: z.string().optional(),
  likes: z.number().optional()
})

const photoSchema = articleSchema.extend({
  photo: z
    .array(
      z.object({
        url: z.string().nonempty(),
        alt: z.string().nonempty()
      })
    )
    .optional()
})

const postSchema = articleSchema.merge(photoSchema)

const articles = defineCollection({
  loader: glob({ base: './src/content', pattern: 'articles/**/*.{md,mdx}' }),
  schema: () => articleSchema
})

const photos = defineCollection({
  loader: glob({ base: './src/content', pattern: 'photos/**/*.{md,mdx}' }),
  schema: () => photoSchema
})

// ? Posts contains all types of 'posts'/'content'
const posts = defineCollection({
  loader: glob({ base: './src/content', pattern: '!(about)/**/*.{md,mdx}' }),
  schema: () => postSchema
})

const about = defineCollection({
  loader: glob({ base: './src/content/about', pattern: '**/*.md' }),
  schema: z.object({ title: z.string().nonempty() })
})

export const collections = {
  articles,
  photos,
  posts,
  about
}
