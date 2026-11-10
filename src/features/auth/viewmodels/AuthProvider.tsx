import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  currentAuthUser,
  observeAuthState,
  type AuthUser,
} from "../model/AuthService";
import { authErrorMessage } from "../model/authErrors";

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  canAccessAccount: boolean;
  /** Re-reads the Firebase user, e.g. after a name change. */
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    ready: false,
    error: null,
  });

  useEffect(() => {
    const failed = (error: unknown) =>
      setState({ user: null, ready: true, error: authErrorMessage(error) });

    // observeAuthState throws at once when the Firebase env vars are missing.
    try {
      return observeAuthState(
        (user) => setState({ user, ready: true, error: null }),
        failed,
      );
    } catch (error) {
      failed(error);
    }
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const user = currentAuthUser();
      setState((current) => (user ? { ...current, user } : current));
    } catch {
      // Firebase is not configured, so there is no user to refresh.
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, canAccessAccount: state.user !== null, refreshUser }),
    [state, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthProvider.");
  }

  return context;
}
