import { useRef, useState } from "react";

import { deleteAccountDocs } from "@/core/storage/cloudDoc";
import { authErrorMessage, errorCode } from "@/features/auth/model/authErrors";
import {
  deleteAccount,
  reauthenticateWithGoogle,
  reauthenticateWithPassword,
  signInMethod,
} from "@/features/auth/model/AuthService";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { removeLegacyFavorites } from "@/features/apod/model/ApodFavoritesRepository";
import { deleteAvatar } from "../model/avatarStorage";
import { useAccountProfile } from "./ProfileProvider";

const CONFIRM_WORD = "DELETE";
// Account documents removed with the account (every signed-in feature that syncs).
const ACCOUNT_DOCS = ["profile", "apodFavorites", "tracking"];
const DOCS_FAILED =
  "We could not remove your saved data, so your account was not deleted. Check your connection and try again.";

const WRONG_PASSWORD_CODES = ["auth/invalid-credential", "auth/wrong-password"];

type Method = "password" | "google" | null;
type FieldErrors = { confirmText?: string; password?: string };

function currentMethod(): Method {
  try {
    return signInMethod();
  } catch {
    return null;
  }
}

export function useDeleteAccountViewModel() {
  const { user } = useAuthSession();
  const { profile, purge } = useAccountProfile();
  const submitting = useRef(false);
  const [visible, setVisible] = useState(false);
  const [method, setMethod] = useState<Method>(null);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setMethod(currentMethod());
    setConfirmText("");
    setPassword("");
    setFieldErrors({});
    setError(null);
    setVisible(true);
  }

  function close() {
    if (busy) return;
    setVisible(false);
  }

  function changeConfirmText(value: string) {
    setConfirmText(value);
    setFieldErrors((current) => ({ ...current, confirmText: undefined }));
    setError(null);
  }

  function changePassword(value: string) {
    setPassword(value);
    setFieldErrors((current) => ({ ...current, password: undefined }));
    setError(null);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (confirmText.trim() !== CONFIRM_WORD) {
      errors.confirmText = `Type ${CONFIRM_WORD} in capital letters to confirm.`;
    }
    if (method === "password" && password.length === 0) {
      errors.password = "Enter your password to confirm it is you.";
    }

    return errors;
  }

  async function submit() {
    if (submitting.current || !user) return;
    const errors = validate();
    setFieldErrors(errors);
    setError(null);
    if (errors.confirmText || errors.password) return;

    submitting.current = true;
    setBusy(true);
    try {
      if (method === "password") await reauthenticateWithPassword(password);
      if (method === "google" && !(await reauthenticateWithGoogle())) return;

      const uid = user.uid;
      const photoUri = profile?.photoUri ?? null;
      // Firestore rules need the user signed in, so the data goes first. If it
      // cannot be removed, stop and keep the account so nothing is orphaned.
      const removed = await deleteAccountDocs(uid, ACCOUNT_DOCS);
      if (removed.error) {
        setError(DOCS_FAILED);
        return;
      }
      await deleteAccount();
      // Cleanup comes after the account is gone, so a failure here is ignored.
      await purge(uid).catch(() => undefined);
      await removeLegacyFavorites(uid);
      deleteAvatar(photoUri);
      // The root route guard leaves the profile screen once auth state is null.
    } catch (failure) {
      if (WRONG_PASSWORD_CODES.includes(errorCode(failure))) {
        setFieldErrors({ password: "That password is not correct." });
      } else {
        setError(authErrorMessage(failure));
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return {
    visible,
    method,
    confirmText,
    password,
    fieldErrors,
    busy,
    error,
    open,
    close,
    changeConfirmText,
    changePassword,
    submit,
  };
}
