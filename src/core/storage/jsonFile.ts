import { File, Paths } from "expo-file-system";

// Returns null when the file is missing.
export async function readJson(name: string): Promise<unknown> {
  const file = new File(Paths.document, name);

  return file.exists ? JSON.parse(await file.text()) : null;
}

// Write to a temporary file first so a crash never leaves a half-written file.
export async function writeJson(name: string, value: unknown): Promise<void> {
  const file = new File(Paths.document, name);
  const temporary = new File(Paths.document, `${name}.tmp`);

  temporary.create({ overwrite: true, intermediates: true });
  await temporary.write(JSON.stringify(value));
  await temporary.move(file, { overwrite: true });
}

// Deleting a file that is not there is fine.
export async function removeJson(name: string): Promise<void> {
  const file = new File(Paths.document, name);

  if (file.exists) file.delete();
}
