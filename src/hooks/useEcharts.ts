import { useEffect, type RefObject } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import {
  applyChartEntranceAnimation,
  getChartAnimationMs,
  observeChartEntrancePlay,
  observeChartResize,
  resolveChartReplayTarget,
  waitForChartReveal,
  withChartAnimation,
} from '../utils/chartResize';

/** 等容器有尺寸后再 init；入场动画结束后再允许 resize 回调 */
export function useEcharts(
  ref: RefObject<HTMLDivElement | null>,
  option: EChartsCoreOption,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const animated = withChartAnimation(option);
    let chart: echarts.ECharts | null = null;
    let disposed = false;
    let rafId = 0;
    let animTimer = 0;
    let unobserve = () => {};
    let unobserveReplay = () => {};
    let resizeObserverActive = false;

    const animMs = getChartAnimationMs(animated);

    const resize = () => chart?.resize();

    const enableResizeObserver = () => {
      if (resizeObserverActive || disposed) return;
      resizeObserverActive = true;
      unobserve = observeChartResize(el, resize);
      resize();
    };

    const playEntrance = () => {
      if (!chart || disposed || !ref.current) return;
      chart.resize();
      applyChartEntranceAnimation(chart, option);
      if (!resizeObserverActive) {
        clearTimeout(animTimer);
        animTimer = window.setTimeout(enableResizeObserver, animMs + 80);
      }
    };

    const init = () => {
      if (disposed || !ref.current) return;
      const { clientWidth, clientHeight } = ref.current;
      if (clientWidth < 2 || clientHeight < 2) {
        rafId = requestAnimationFrame(init);
        return;
      }

      void waitForChartReveal(ref.current).then(() => {
        if (disposed || !ref.current) return;
        chart = echarts.init(ref.current);
        unobserveReplay = observeChartEntrancePlay(
          resolveChartReplayTarget(ref.current),
          playEntrance,
        );
      });
    };

    init();

    const onAnimEnd = (event: AnimationEvent) => {
      if (event.animationName !== 'chartFadeIn') return;
      const target = event.target as Node;
      if (target === el || el.contains(target) || el.parentElement?.contains(target)) {
        resize();
      }
    };
    el.addEventListener('animationend', onAnimEnd);
    el.parentElement?.addEventListener('animationend', onAnimEnd);

    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(animTimer);
      el.removeEventListener('animationend', onAnimEnd);
      el.parentElement?.removeEventListener('animationend', onAnimEnd);
      window.removeEventListener('resize', resize);
      unobserve();
      unobserveReplay();
      chart?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
