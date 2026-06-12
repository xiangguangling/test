import { useEffect, useRef, useState } from 'react';
import {
  getViewportIntersectionRatio,
  observeChartViewportToggle,
  resolveChartScrollRoot,
} from '../utils/chartResize';

/** 每次滚入视口时重播 CSS 入场类（离开视口时移除以重置 animation） */
export function useChartViewportReveal(activeClass: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollRoot = resolveChartScrollRoot(el);
    const isOverview = scrollRoot?.classList.contains('page-content--overview');
    const opts = scrollRoot
      ? {
          root: scrollRoot,
          enterThreshold: isOverview ? 0.06 : 0.2,
          leaveThreshold: 0.02,
          leaveWhenFullyHidden: true,
        }
      : { enterThreshold: 0.06, leaveThreshold: 0.03 };

    const syncInitial = () => {
      if (getViewportIntersectionRatio(el, opts.root ?? null) >= (opts.enterThreshold ?? 0.06)) {
        setRevealed(true);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(syncInitial));

    return observeChartViewportToggle(
      el,
      () => setRevealed(true),
      () => setRevealed(false),
      opts,
    );
  }, []);

  return { ref, className: revealed ? activeClass : '' };
}
