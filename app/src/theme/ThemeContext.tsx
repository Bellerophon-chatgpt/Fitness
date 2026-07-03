import { createContext, useContext } from 'react';
import type { Theme } from '../types';

export const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeCtx);
