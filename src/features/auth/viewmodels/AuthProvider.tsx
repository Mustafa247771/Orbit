import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { observeAuthState, type AuthUser } from "../model/AuthService";
import { authErrorMessage } from "../model/authErrors";

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  error: string | null;
};

type AuthContextValue = AuthState & {
  canAccessAccount: boolean;
  retry: () => void;
};

const INITIAL_STATE: AuthState = {
  user: null,
  ready: false,
  error: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    // Initialize after render, catching setup errors without breaking guest mode.
    void Promise.resolve()
      .then(() => {
        if (!active) return;

        unsubscribe = observeAuthState(
          (user) => {
            if (active) {
              setState({ user, ready: true, error: null });
            }
          },
          (error) => {
            if (active) {
              setState({
                user: null,
                ready: true,
                error: authErrorMessage(error),
              });
            }
          },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            user: null,
            ready: true,
            error: authErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState(INITIAL_STATE);
    setAttempt((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      retry,
      canAccessAccount: state.ready && state.user !== null,
    }),
    [state, retry],
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
