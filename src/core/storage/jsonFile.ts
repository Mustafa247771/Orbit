import { File, Paths } from "expo-file-system";

/** Small JSON cache shared by orbital elements and weather forecasts. */
export async function readJson(filename: string): Promise<unknown> {
  const file = new File(Paths.cache, filename);
  if (!file.exists) throw new Error(`Cache missing: ${filename}`);
  return JSON.parse(await file.text()) as unknown;
}

export async function writeJson(filename: string, value: unknown): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (!file.exists) file.create({ intermediates: true });
  file.write(JSON.stringify(value));
}
