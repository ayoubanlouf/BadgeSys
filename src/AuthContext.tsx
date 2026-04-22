import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthState {
  token: string | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (token: string, username: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  setAuth: () => {},
  clearAuth: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {

  const [state, setState] = useState<AuthState>(() => ({
    token: localStorage.getItem("badge_token"),
    username: localStorage.getItem("badge_username"),
  }));

  const setAuth = (token: string, username: string) => {
    localStorage.setItem("badge_token", token);
    localStorage.setItem("badge_username", username);
    setState({ token, username });
  };

  const clearAuth = () => {
    localStorage.removeItem("badge_token");
    localStorage.removeItem("badge_username");
    setState({ token: null, username: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
