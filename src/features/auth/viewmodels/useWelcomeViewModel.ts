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
    if (focused && session.user) {
      router.replace("./earth");
    }
  }, [focused, session.user]);

  return {
    still,
    paused: still || !focused,
    toggleMotion: () => setStill((value) => !value),
    openAuth: (mode: "login" | "signup") => {
      router.push({ pathname: "./login", params: { mode } });
    },
    exploreGuest: () => router.replace("./earth"),
  };
}
