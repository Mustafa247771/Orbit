import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { authErrorMessage } from "../model/authErrors";
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
  const [mode, setMode] = useState<AuthMode>(() =>
    params.mode === "signup"
      ? "signup"
      : params.mode === "reset"
        ? "reset"
        : "login",
  );
  const [fields, setFields] = useState<AuthFields>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inFlight = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    if (session.ready && session.user) {
      router.dismissAll();
      router.replace("./earth");
    }
  }, [session.ready, session.user]);

  function setField(key: keyof AuthFields, value: string) {
    if (inFlight.current) return;
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError(null);
    setNotice(null);
  }

  function changeMode(next: AuthMode) {
    if (inFlight.current) return;
    setMode(next);
    setFields((current) => ({ ...current, password: "", confirmPassword: "" }));
    setErrors({});
    setError(null);
    setNotice(null);
    setShowPassword(false);
  }

  async function submit() {
    if (inFlight.current || !session.ready || session.error) return;
    const fieldErrors = validateAuthForm(mode, fields);
    setErrors(fieldErrors);
    setError(null);
    setNotice(null);
    if (Object.keys(fieldErrors).length) return;

    inFlight.current = true;
    setBusy(true);

    try {
      if (mode === "signup") {
        const policyError = await newPasswordError(fields.password);
        if (!active.current) return;
        if (policyError) {
          setErrors({ password: policyError });
          return;
        }
        await createAccount(fields.email, fields.password);
      } else if (mode === "login") {
        await logIn(fields.email, fields.password);
      } else {
        await resetPassword(fields.email);
      }

      if (active.current) {
        setFields((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));
        if (mode === "reset") setNotice(RESET_NOTICE);
      }
    } catch (failure) {
      if (active.current) {
        const unknownEmail =
          typeof failure === "object" &&
          failure !== null &&
          "code" in failure &&
          failure.code === "auth/user-not-found";
        if (mode === "reset" && unknownEmail) setNotice(RESET_NOTICE);
        else setError(authErrorMessage(failure));
      }
    } finally {
      inFlight.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function continueWithGoogle() {
    if (inFlight.current || !session.ready || session.error) return;
    inFlight.current = true;
    setBusy(true);
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    try {
      const user = await logInWithGoogle();
      if (user && active.current) {
        setFields((current) => ({
          ...current,
          password: "",
          confirmPassword: "",
        }));
      }
    } catch (failure) {
      if (active.current) setError(authErrorMessage(failure));
    } finally {
      inFlight.current = false;
      if (active.current) {
        setBusy(false);
        setGoogleBusy(false);
      }
    }
  }

  return {
    mode,
    ...COPY[mode],
    fields,
    errors,
    error: error ?? session.error,
    notice,
    busy,
    googleBusy,
    emailBusy: busy && !googleBusy,
    continueWithGoogle,
    ready: session.ready,
    canSubmit: session.ready && !session.error && !busy,
    setupError: session.error !== null,
    showPassword,
    setField,
    changeMode,
    submit,
    togglePassword: () => setShowPassword((value) => !value),
    retry: session.retry,
    back: () => (router.canGoBack() ? router.back() : router.replace("./")),
    exploreGuest: () => router.replace("./earth"),
  };
}
