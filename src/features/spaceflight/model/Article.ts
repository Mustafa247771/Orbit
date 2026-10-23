export type Article = {
  id: number;
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  site: string;
  publishedAt: string;
  featured: boolean;
};
