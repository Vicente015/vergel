import { getCollection } from 'astro:content'

const posts = await getCollection('posts')
type PostType = Omit<(typeof posts)[number], 'collection'>

export const sortPosts = (a: PostType, b: PostType) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()

export const filterOutDraftPosts = (post: PostType) =>
  !post.id.startsWith('_') && post.data.visibility !== 'private'

const processPost = (post: PostType) => ({
  ...post,
  data: {
    ...post.data,
    title:
      post.data.title?.trim() ??
      post.data.summary?.trim().substring(0, 50) ??
      post.body?.trim().substring(0, 50)
  }
})

/**
 * Get all posts sorted by publication date, filtering out posts whose filenames start with _
 */
export async function getPosts() {
  return posts.filter(filterOutDraftPosts).map(processPost).sort(sortPosts)
}
