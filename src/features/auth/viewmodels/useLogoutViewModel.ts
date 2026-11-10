import { useState } from "react";

import { authErrorMessage } from "../model/authErrors";
import { logOut } from "../model/AuthService";

export function useLogoutViewModel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await logOut();
      // The root route guard returns signed-out users to the welcome screen.
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, logout };
}
