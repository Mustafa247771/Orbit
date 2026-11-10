import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { authErrorMessage, errorCode } from "../model/authErrors";
import {
  createAccount,
  logIn,
  logInWithGoogle,
  newPasswordError,
  resetPassword,
} from "../model/AuthService";
import {
    validateAuthForm,
    type AuthFieldErrors,
    type AuthFields,
    type AuthMode,
} from "../model/authValidation";
import { useAuthSession } from "./AuthProvider";

const COPY = {
  login: {
    title: "Welcome back.",
    subtitle: "Sign in to continue your exploration.",
    action: "Log in",
  },
  signup: {
    title: "Join the orbit.",
    subtitle: "Create your account and start exploring.",
    action: "Create account",
  },
  reset: {
    title: "Find your way back.",
    subtitle: "We will email you a link to reset your password.",
    action: "Send reset link",
  },
} as const;

const RESET_NOTICE =
  "If an account uses this email, you will receive a password reset link.";

export function useAuthViewModel() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const session = useAuthSession();
  const [mode, setMode] = useState<AuthMode>(
    params.mode === "signup" || params.mode === "reset" ? params.mode : "login",
  );
  const [fields, setFields] = useState<AuthFields>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session.user) {
      router.dismissAll();
      router.replace("./earth");
    }
  }, [session.user]);

  function setField(key: keyof AuthFields, value: string) {
    if (busy) return;
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError(null);
    setNotice(null);
  }

  function changeMode(next: AuthMode) {
    if (busy) return;
    setMode(next);
    setFields((current) => ({ ...current, password: "", confirmPassword: "" }));
    setErrors({});
    setError(null);
    setNotice(null);
    setShowPassword(false);
  }

  async function submit() {
    if (busy) return;
    const fieldErrors = validateAuthForm(mode, fields);
    setErrors(fieldErrors);
    setError(null);
    setNotice(null);
    if (Object.keys(fieldErrors).length) return;

    setBusy("email");
    try {
      if (mode === "signup") {
        const policyError = await newPasswordError(fields.password);
        if (policyError) {
          setErrors({ password: policyError });
          return;
        }
        await createAccount(fields.email, fields.password);
      } else if (mode === "login") {
        await logIn(fields.email, fields.password);
      } else {
        await resetPassword(fields.email);
        setNotice(RESET_NOTICE);
      }
    } catch (failure) {
      if (mode === "reset" && errorCode(failure) === "auth/user-not-found")
        setNotice(RESET_NOTICE);
      else setError(authErrorMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  async function continueWithGoogle() {
    if (busy) return;
    setBusy("google");
    setError(null);
    setNotice(null);
    try {
      await logInWithGoogle();
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  return {
    mode,
    ...COPY[mode],
    fields,
    errors,
    error: error ?? session.error,
    notice,
    busy: busy !== null,
    emailBusy: busy === "email",
    googleBusy: busy === "google",
    canSubmit: busy === null && !session.error,
    showPassword,
    setField,
    changeMode,
    submit,
    continueWithGoogle,
    togglePassword: () => setShowPassword((value) => !value),
    exploreGuest: () => router.replace("./earth"),
  };
}
