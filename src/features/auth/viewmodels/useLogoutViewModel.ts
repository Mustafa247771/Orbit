import { useEffect, useRef, useState } from "react";

import { authErrorMessage } from "../model/authErrors";
import { logOut } from "../model/AuthService";

export function useLogoutViewModel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function logout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await logOut();
      // The root route guard returns signed-out users to the welcome screen.
    } catch (failure) {
      if (active.current) setError(authErrorMessage(failure));
    } finally {
      inFlight.current = false;
      if (active.current) setBusy(false);
    }
  }

  return { busy, error, logout };
}
