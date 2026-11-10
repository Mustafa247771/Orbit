import { useAuthSession } from "@/features/auth/viewmodels/AuthProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";

export function useGlobeMenu() {
  const { canAccessAccount } = useAuthSession();
  // Login dismisses the stack then replaces Earth, remounting it with a closed menu.
  const [open, setOpen] = useState(false);
  const toggleMenu = useCallback(() => {
    if (canAccessAccount) setOpen((current) => !current);
  }, [canAccessAccount]);
  const openLogin = useCallback(() => router.push("./login"), []);

  return {
    menuOpen: canAccessAccount && open,
    toggleMenu,
    canAccessMenu: canAccessAccount,
    openLogin,
  };
}
