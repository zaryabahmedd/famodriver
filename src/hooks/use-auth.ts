import { createContext, useContext } from 'react';

export type AuthContextValue = {
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
