type NameSource = { displayName: string | null; email: string | null };

// The part of an email before the @.
export function emailLocalPart(email: string | null): string {
  return email ? (email.split("@")[0] ?? "").trim() : "";
}

export function nameOf(user: NameSource): string {
  return user.displayName?.trim() || emailLocalPart(user.email) || "Observer";
}

export function handleOf(user: NameSource): string {
  return emailLocalPart(user.email) || "observer";
}

// First letter of the first and last word; one word gives one letter.
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words[words.length - 1];
  if (!first || !last) return "?";
  const letters =
    words.length === 1
      ? [Array.from(first)[0]]
      : [Array.from(first)[0], Array.from(last)[0]];

  return letters.join("").toUpperCase();
}
