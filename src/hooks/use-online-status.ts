import { createContext, useContext } from 'react';

export type OnlineStatusValue = {
  online: boolean;
  starting: boolean;
  setOnline: (online: boolean) => void;
  setStarting: (starting: boolean) => void;
  goOnline: (() => Promise<boolean>) | null;
  setGoOnline: (fn: (() => Promise<boolean>) | null) => void;
  /** Marks the rider unavailable server-side (used by the Offline toggle and on logout). */
  goOffline: (() => Promise<void>) | null;
  setGoOffline: (fn: (() => Promise<void>) | null) => void;
};

export const OnlineStatusContext = createContext<OnlineStatusValue>({
  online: false,
  starting: false,
  setOnline: () => {},
  setStarting: () => {},
  goOnline: null,
  setGoOnline: () => {},
  goOffline: null,
  setGoOffline: () => {},
});

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}
