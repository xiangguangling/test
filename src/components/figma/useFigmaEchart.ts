import { useEffect, useRef } from 'react';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import {
  applyChartEntranceAnimation,
  observeChartEntrancePlay,
  observeChartResize,
  resolveChartReplayTarget,
  waitForChartReveal,
} from '../../utils/chartResize';

/** Init ECharts inside a fixed-size Figma canvas cell; disposes on unmount. */
export function useFigmaEchart(option: EChartsOption | null, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !option) return;

    const el = ref.current;
    let chart: echarts.ECharts | null = null;
    let disposed = false;
    let rafId = 0;
    let unobserve = () => {};
    let unobserveReplay = () => {};

    const resize = () => {
      if (chart && ref.current) chart.resize();
    };

    const playEntrance = () => {
      if (!chart || disposed || !ref.current) return;
      chart.resize();
      applyChartEntranceAnimation(chart, option, { notMerge: true });
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
        unobserve = observeChartResize(ref.current, resize);
        unobserveReplay = observeChartEntrancePlay(
          resolveChartReplayTarget(ref.current),
          playEntrance,
        );
      });
    };

    init();
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      unobserve();
      unobserveReplay();
      window.removeEventListener('resize', resize);
      chart?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export function figmaAxisStyle() {
  return {
    axisLabel: { color: '#383874', fontSize: 14, fontFamily: 'Poppins', opacity: 0.6 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F1F1F5' } },
  };
}
