import { useRef, useState } from "react";

import { updateDisplayName } from "@/features/auth/model/AuthService";
import { authErrorMessage } from "@/features/auth/model/authErrors";
import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { nameOf } from "../model/profileNames";
import { validateDisplayName } from "../model/profileValidation";

export function useEditProfileViewModel() {
  const { user, refreshUser } = useAuthSession();
  const [visible, setVisible] = useState(false);
  const [name, setNameText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingNow = useRef(false);

  function open() {
    setNameText(user ? nameOf(user) : "");
    setFieldError(null);
    setError(null);
    setVisible(true);
  }

  function close() {
    if (saving) return;
    setVisible(false);
  }

  function setName(value: string) {
    setNameText(value);
    setFieldError(null);
    setError(null);
  }

  async function save() {
    if (savingNow.current) return;

    const problem = validateDisplayName(name);
    setFieldError(problem);
    setError(null);
    if (problem) return;

    savingNow.current = true;
    setSaving(true);
    try {
      await updateDisplayName(name.trim());
      refreshUser();
      setVisible(false);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      savingNow.current = false;
      setSaving(false);
    }
  }

  return {
    visible,
    name,
    email: user?.email ?? "",
    fieldError,
    error,
    saving,
    open,
    close,
    setName,
    save,
  };
}
