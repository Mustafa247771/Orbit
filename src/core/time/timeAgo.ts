export function timeAgo(timestamp: string | number, now: number) {
  const minutes = Math.max(
    0,
    Math.round((now - new Date(timestamp).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
