import { useLayoutEffect, useRef, type RefObject } from "react";

// Reset before paint and invalidate work from the previous account or scope.
export function useResetOnUid(
  uid: string | null | undefined,
  reset: () => void,
  suppliedRef?: RefObject<number>,
) {
  const internalRef = useRef(0);
  const latest = useRef(reset);
  useLayoutEffect(() => {
    latest.current = reset;
  });
  useLayoutEffect(() => {
    latest.current();
    const cancel = () => {
      if (suppliedRef) suppliedRef.current++;
      else internalRef.current++;
    };
    return cancel;
  }, [uid, suppliedRef]);
  return suppliedRef ?? internalRef;
}
