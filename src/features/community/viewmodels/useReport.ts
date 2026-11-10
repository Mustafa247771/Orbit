import { useCallback, useRef, useState } from "react";

import { communityErrorMessage } from "../model/communityErrors";
import { communityRepository } from "../model/communityRepository";
import type { ReportReason } from "../model/communityTypes";
import { validateReport, type ReportErrors } from "../model/reportValidation";
import { useResetOnUid } from "./useResetOnUid";

export function useReport(uid: string | null) {
  const [postId, setPostId] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<ReportErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const guard = useRef(false);
  const generationRef = useResetOnUid(uid, () => {
    setPostId(null);
    setNotice(null);
    setReason(null);
    setNote("");
    setError(null);
    setErrors({});
    setBusy(false);
    guard.current = false;
  });

  const open = useCallback((id: string) => {
    if (guard.current) return;
    setPostId(id);
    setReason(null);
    setNote("");
    setErrors({});
    setError(null);
    setNotice(null);
  }, []);
  const close = () => {
    if (!guard.current) setPostId(null);
  };
  const submit = async () => {
    if (guard.current || !postId) return;
    const problems = validateReport({ reason, note });
    setErrors(problems);
    setError(null);
    if (Object.keys(problems).length || !reason) return;
    if (!uid) {
      setError("Sign in to report a post.");
      return;
    }
    const token = generationRef.current;
    guard.current = true;
    setBusy(true);
    try {
      await communityRepository.report(postId, uid, reason, note.trim());
      if (token !== generationRef.current) return;
      setPostId(null);
      setNotice("Report sent. Thank you for helping care for the community.");
    } catch (failure) {
      if (token === generationRef.current) setError(communityErrorMessage(failure));
    } finally {
      if (token === generationRef.current) {
        guard.current = false;
        setBusy(false);
      }
    }
  };
  return {
    postId,
    reason,
    note,
    errors,
    error,
    notice,
    busy,
    open,
    close,
    setReason: (value: ReportReason) => {
      setReason(value);
      setErrors((current) => ({ ...current, reason: undefined }));
    },
    setNote: (value: string) => {
      setNote(value);
      setErrors((current) => ({ ...current, note: undefined }));
    },
    submit: () => {
      void submit();
    },
  };
}
