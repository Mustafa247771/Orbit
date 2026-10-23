import type { Article } from "./Article";

const API_URL = "https://api.spaceflightnewsapi.net/v4/articles/?limit=24";

type ApiArticle = {
  id: number;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  news_site: string;
  published_at: string;
  featured: boolean;
};

function mapArticle(item: ApiArticle): Article {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    url: item.url,
    imageUrl: item.image_url || null,
    site: item.news_site,
    publishedAt: item.published_at,
    featured: item.featured,
  };
}

export class NewsService {
  async getLatest(): Promise<Article[]> {
    const response = await fetch(API_URL, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(`News service returned ${response.status}`);
    const payload = (await response.json()) as { results?: ApiArticle[] };
    return (payload.results ?? []).map(mapArticle);
  }
}

export const newsService = new NewsService();
