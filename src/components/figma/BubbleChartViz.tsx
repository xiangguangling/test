import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, FIGMA_CARD_STYLE, SCHOOL_TYPE_COLORS, SCHOOL_TYPES } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';

const W = 863;
const H = 778;

export default function BubbleChartViz({ data }: { data: DashboardData }) {
  const series = useMemo(() => {
    const cats = ['A类-学校管理与安全', 'B类-办学硬件与环境', 'C类-师资队伍与发展'];
    const names = ['Design', 'Finance', 'Business', 'Development'];
    return cats.map((cat, ci) => {
      const inds = data.indicators.filter(i => i.category === cat && i.key !== '得分率');
      return {
        name: names[ci] ?? cat,
        type: 'scatter' as const,
        symbolSize: (val: number[]) => Math.max(8, Math.sqrt(val[2]) * 1.2),
        itemStyle: { color: SCHOOL_TYPE_COLORS[ci], opacity: 0.75 },
        data: inds.map(ind => [
          +(ind.avg_rate * 100).toFixed(1),
          ind.fail_pct,
          ind.fail_count,
          ind.name,
        ]),
      };
    });
  }, [data]);

  const chartRef = useFigmaEchart({
    grid: { left: 64, right: 32, top: 48, bottom: 48 },
    xAxis: { type: 'value', name: '得分率(%)', max: 100, ...figmaAxisStyle() },
    yAxis: { type: 'value', name: '不达标率(%)', ...figmaAxisStyle() },
    legend: {
      top: 12,
      right: 24,
      textStyle: { color: FIGMA.textMuted, fontFamily: 'Roboto', fontSize: 12 },
      data: series.map(s => s.name),
    },
    series,
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const x = p as { value: number[]; seriesName?: string };
        return `${x.value[3]}<br/>${x.seriesName}<br/>得分率: ${x.value[0]}%<br/>不达标: ${x.value[2]} 所`;
      },
    },
  }, [data, series]);

  return (
    <ChartCard title="指标得分与不达标关联">
      <FigmaScaledCanvas designWidth={W} designHeight={H}>
        <div style={{ ...FIGMA_CARD_STYLE, borderRadius: 0, filter: 'none' }}>
          <div style={{ position: 'absolute', left: 32, top: 24, fontSize: 16, fontWeight: 600, fontFamily: 'Poppins', color: FIGMA.textDark }}>
            Data visualisation
          </div>
          <div ref={chartRef} style={{ width: W, height: H }} />
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
