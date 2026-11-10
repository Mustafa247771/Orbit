import { FormMessage } from "@/components/ui/FormMessage";
import { StateMessage } from "@/components/ui/StateMessage";

type FeedStatusProps = {
  loading: boolean;
  empty: boolean;
  offline: boolean;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;
};

export function FeedStatus({
  loading,
  empty,
  offline,
  error,
  emptyMessage,
  onRetry,
}: FeedStatusProps) {
  return (
    <>
      {offline ? (
        <FormMessage tone="gold" className="mx-5 mt-4">
          {empty
            ? "Offline. Check your connection and try again."
            : "Offline, showing saved posts."}
        </FormMessage>
      ) : null}
      {loading ? <StateMessage loading message="Finding sightings…" /> : null}
      {!loading && error ? (
        <StateMessage title="Community unavailable" message={error} onRetry={onRetry} />
      ) : null}
      {!loading && empty && !error ? (
        <StateMessage title="Your shared sky" message={emptyMessage} />
      ) : null}
      {!loading && empty && offline ? (
        <FormMessage tone="muted" className="mx-5 mt-3">
          No saved posts for this feed yet.
        </FormMessage>
      ) : null}
    </>
  );
}
