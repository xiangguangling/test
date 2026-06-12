import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, SCHOOL_TYPE_COLORS, SCHOOL_TYPES } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';

const W = 1920;
const H = 636;

export default function ScatterPlotViz({ data }: { data: DashboardData }) {
  const allPoints = useMemo(() => {
    const dist = data.score_distribution;
    const result: Record<string, [number, number][]> = { 小学: [], 初中: [], 九年制: [] };
    const typePool: string[] = [];
    for (const t of SCHOOL_TYPES) {
      const cnt = data.by_school_type[t]?.count || 0;
      for (let i = 0; i < cnt; i++) typePool.push(t);
    }
    for (let i = typePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
    }
    let pi = 0;
    for (const d of dist) {
      for (let i = 0; i < d.count; i++) {
        const t = typePool[pi % typePool.length];
        pi++;
        result[t].push([
          d.score + (Math.random() - 0.5) * 0.5,
          +(d.score / 44 + (Math.random() - 0.5) * 0.008).toFixed(4),
        ]);
      }
    }
    return result;
  }, [data]);

  const series = SCHOOL_TYPES.map((t, i) => ({
    name: t,
    type: 'scatter' as const,
    symbolSize: 4,
    large: true,
    largeThreshold: 400,
    itemStyle: { color: SCHOOL_TYPE_COLORS[i] + '88', borderColor: SCHOOL_TYPE_COLORS[i], borderWidth: 0.5 },
    data: allPoints[t],
  }));

  const chartRef = useFigmaEchart({
    grid: { left: 72, right: 40, top: 40, bottom: 48 },
    xAxis: { type: 'value', name: '总分', min: 34, max: 44, ...figmaAxisStyle() },
    yAxis: {
      type: 'value', name: '得分率', min: 0.78, max: 1.02,
      ...figmaAxisStyle(),
      axisLabel: { color: '#383874', fontSize: 14, fontFamily: 'Poppins', opacity: 0.6, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
    },
    legend: { top: 8, right: 40, textStyle: { color: FIGMA.textSecondary, fontSize: 12 } },
    series,
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const x = p as { seriesName?: string; value: [number, number] };
        return `${x.seriesName}<br/>总分: ${x.value[0].toFixed(1)}/44<br/>得分率: ${(x.value[1] * 100).toFixed(1)}%`;
      },
    },
  }, [data, allPoints, series]);

  return (
    <ChartCard title="学校总分与得分率分布">
      <FigmaScaledCanvas designWidth={W} designHeight={H}>
        <div ref={chartRef} style={{ width: W, height: H, background: FIGMA.bgCard, borderRadius: 12 }} />
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
