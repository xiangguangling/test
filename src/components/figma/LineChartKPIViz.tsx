import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, FIGMA_CARD_STYLE, SCHOOL_TYPE_COLORS, SCHOOL_TYPES } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';

const W = 1071;
const H = 528;

export default function LineChartKPIViz({ data }: { data: DashboardData }) {
  const dist = data.score_distribution;
  const xLabels = dist.map(d => d.score.toString());

  const seriesData = useMemo(() => {
    const total = dist.reduce((s, d) => s + d.count, 0);
    return SCHOOL_TYPES.map((t, ti) => {
      const ratio = (data.by_school_type[t]?.count || 0) / total;
      return {
        name: t,
        type: 'line' as const,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: SCHOOL_TYPE_COLORS[ti] },
        itemStyle: { color: SCHOOL_TYPE_COLORS[ti] },
        data: dist.map(d => Math.round(d.count * ratio)),
      };
    });
  }, [data, dist]);

  const kpis = [
    { label: '监测学校', value: data.overall.total_schools, color: FIGMA.legendPurple },
    { label: '平均总分', value: data.overall.avg_score.toFixed(1), color: FIGMA.yellow },
    { label: '综合得分率', value: `${(data.overall.avg_rate * 100).toFixed(1)}%`, color: FIGMA.legendPink },
    { label: '满分学校', value: data.overall.schools_full_score, color: FIGMA.legendIndigo },
  ];

  const chartRef = useFigmaEchart({
    grid: { left: 56, right: 24, top: 28, bottom: 36 },
    xAxis: { type: 'category', data: xLabels, ...figmaAxisStyle() },
    yAxis: { type: 'value', ...figmaAxisStyle() },
    series: seriesData,
    tooltip: { trigger: 'axis' },
  }, [data, seriesData, xLabels]);

  return (
    <ChartCard title="各类型学校分数段对比">
      <FigmaScaledCanvas designWidth={W} designHeight={H}>
        <div style={FIGMA_CARD_STYLE}>
          <div style={{ position: 'absolute', left: 30, top: 20, right: 30, display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Poppins', color: FIGMA.textDark }}>Sales Figures</span>
            {SCHOOL_TYPES.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: SCHOOL_TYPE_COLORS[i] }} />
                <span style={{ fontSize: 14, color: FIGMA.textMuted, fontFamily: 'Roboto' }}>{t}</span>
              </div>
            ))}
          </div>
          <div ref={chartRef} style={{ position: 'absolute', left: 30, top: 68, width: W - 60, height: H - 90 }} />
          <div style={{ position: 'absolute', right: 30, bottom: 16, display: 'flex', gap: 20 }}>
            {kpis.map(k => (
              <div key={k.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: FIGMA.textSecondary }}>{k.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: k.color, fontFamily: 'Open Sans' }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
