import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useAuthSession } from "./AuthProvider";

export function useWelcomeViewModel() {
  const session = useAuthSession();
  const [still, setStill] = useState(false);
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (focused && session.ready && session.user) {
      router.replace("./earth");
    }
  }, [focused, session.ready, session.user]);

  return {
    still,
    paused: still || !focused,
    ready: session.ready,
    toggleMotion: () => setStill((value) => !value),
    openAuth: (mode: "login" | "signup") => {
      router.push({ pathname: "./login", params: { mode } });
    },
    exploreGuest: () => router.replace("./earth"),
  };
}
