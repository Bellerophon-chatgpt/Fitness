import { createContext, useContext } from 'react';

export const SyncCtx = createContext<{ offline: boolean; syncEnabled: boolean }>({
  offline: false,
  syncEnabled: false,
});

export const useSync = () => useContext(SyncCtx);
