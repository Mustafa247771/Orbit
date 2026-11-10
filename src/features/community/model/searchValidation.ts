export const OBSERVER_SEARCH_MIN = 2;
export const OBSERVER_SEARCH_MAX = 40;

export function validateObserverSearch(query: string): string | null {
  const length = query.trim().length;

  if (length < OBSERVER_SEARCH_MIN) {
    return `Enter at least ${OBSERVER_SEARCH_MIN} characters to find an observer.`;
  }
  if (length > OBSERVER_SEARCH_MAX) {
    return `Keep your search to ${OBSERVER_SEARCH_MAX} characters.`;
  }
  return null;
}
