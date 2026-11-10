export type NotificationTarget = "/apod" | "/launches";

const ALLOWED: readonly NotificationTarget[] = ["/apod", "/launches"];

/** Maps notification payload data to an allow-listed route, or null. */
export function notificationTarget(data: unknown): NotificationTarget | null {
  if (typeof data !== "object" || data === null) return null;
  const href = (data as { href?: unknown }).href;
  return ALLOWED.find((allowed) => allowed === href) ?? null;
}
