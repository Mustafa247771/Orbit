import type { SpacePicture } from "./SpacePicture";

const SEARCH_URL = "https://images-api.nasa.gov/search";
const PAGE_SIZE = 12;

type LibraryItem = {
  data?: {
    nasa_id: string;
    title: string;
    description?: string;
    center?: string;
    date_created?: string;
  }[];
  links?: { href: string }[];
};

const stripTags = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function mapItem(item: LibraryItem): SpacePicture | null {
  const data = item.data?.[0];
  const thumbnailUrl = item.links?.[0]?.href;
  if (!data || !thumbnailUrl) return null;
  return {
    id: data.nasa_id,
    title: data.title,
    description: stripTags(data.description ?? ""),
    thumbnailUrl,
    // Search results only link a small preview; every image also has an original.
    imageUrl: thumbnailUrl.replace(/~(thumb|small|medium)\./, "~orig."),
    credit: `NASA ${data.center ?? ""}`.trim(),
    year: (data.date_created ?? "").slice(0, 4),
  };
}

export class NasaImageService {
  async search(query: string): Promise<SpacePicture[]> {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&media_type=image&page_size=${PAGE_SIZE}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(`NASA image library returned ${response.status}`);
    const payload = (await response.json()) as {
      collection?: { items?: LibraryItem[] };
    };

    const pictures: SpacePicture[] = [];
    for (const item of payload.collection?.items ?? []) {
      const picture = mapItem(item);
      if (picture && !pictures.some((seen) => seen.title === picture.title))
        pictures.push(picture);
    }
    return pictures;
  }
}

export const nasaImageService = new NasaImageService();
