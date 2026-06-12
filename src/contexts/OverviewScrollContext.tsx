import { createContext, useContext, type RefObject } from 'react';

export const OverviewScrollContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function useOverviewScrollRoot() {
  return useContext(OverviewScrollContext);
}
