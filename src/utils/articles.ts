import { getCollection } from 'astro:content'
import { filterOutDraftPosts, sortPosts } from './posts'

const articles = await getCollection('articles')

export async function getArticles() {
  return articles.filter(filterOutDraftPosts).sort(sortPosts)
}
