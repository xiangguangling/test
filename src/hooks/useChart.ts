import { useEffect, type RefObject } from 'react';
import type { EChartsOption } from 'echarts';
import { mountEcharts } from '../utils/chartResize';

/** Mount ECharts on a div; resize on layout changes and window resize. */
export function useChart(
  ref: RefObject<HTMLDivElement | null>,
  option: EChartsOption | null,
  deps: unknown[],
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !option) return;

    const chart = mountEcharts(el, option);
    return () => chart.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
