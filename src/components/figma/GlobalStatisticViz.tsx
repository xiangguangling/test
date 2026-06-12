import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, FIGMA_CARD_STYLE } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';
import { getThreeDimGaugeInsight } from '../ChartInsights';

const W = 808;
const H = 693;
const W_COMPACT = 280;
const H_COMPACT = 240;

export default function GlobalStatisticViz({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const dw = compact ? W_COMPACT : W;
  const dh = compact ? H_COMPACT : H;
  const center = +(data.overall.avg_rate * 100).toFixed(1);
  const rings = useMemo(() => {
    const cats = ['A类-学校管理与安全', 'B类-办学硬件与环境', 'C类-师资队伍与发展'];
    const labels = ['安全管理', '硬件环境', '师资发展'];
    const colors = [FIGMA.purple, FIGMA.pink, FIGMA.cyan];
    return cats.map((cat, i) => {
      const inds = data.indicators.filter(x => x.category === cat && x.key !== '得分率');
      const avg = inds.reduce((s, x) => s + x.avg_rate, 0) / (inds.length || 1);
      return { label: labels[i], value: +(avg * 100).toFixed(1), color: colors[i] };
    });
  }, [data]);

  const chartRef = useFigmaEchart({
    backgroundColor: 'transparent',
    series: [
      ...rings.map((r, i) => ({
        type: 'gauge' as const,
        center: ['50%', '52%'],
        radius: `${72 - i * 14}%`,
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        pointer: { show: false },
        progress: { show: true, width: compact ? 7 : 10, roundCap: true, itemStyle: { color: r.color } },
        axisLine: { lineStyle: { width: compact ? 7 : 10, color: [[1, '#F2F5FA']] as [number, string][] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: r.value }],
      })),
      {
        type: 'gauge',
        center: ['50%', '52%'],
        radius: '28%',
        startAngle: 0,
        endAngle: 360,
        pointer: { show: false },
        progress: { show: false },
        axisLine: { lineStyle: { width: 0 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          fontSize: compact ? 26 : 42,
          fontWeight: 700,
          fontFamily: 'Open Sans',
          color: FIGMA.textPrimary,
          offsetCenter: [0, 0],
          formatter: (value: number) => `${value.toFixed(1)}%`,
        },
        data: [{ value: center }],
      },
    ],
  }, [data, center, rings, compact]);

  return (
    <ChartCard
      title="三大维度综合得分率"
      className={compact ? 'chart-card--compact' : ''}
      insight={getThreeDimGaugeInsight(data)}
    >
      <FigmaScaledCanvas designWidth={dw} designHeight={dh} fillHeight={compact}>
        <div style={{ ...FIGMA_CARD_STYLE, borderRadius: 0, filter: 'none' }}>
          <div ref={chartRef} style={{
            position: 'absolute',
            left: compact ? 8 : 40,
            top: compact ? 14 : 60,
            width: dw - (compact ? 16 : 80),
            height: dh - (compact ? 28 : 120),
          }} />
          {compact ? (
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rings.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ color: FIGMA.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: FIGMA.textPrimary }}>{r.value}%</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {rings.map((r, i) => (
                <div key={r.label} style={{ position: 'absolute', right: 36, top: 120 + i * 52, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                  <span style={{ fontSize: 13, color: FIGMA.textMuted, fontFamily: 'Roboto' }}>{r.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: FIGMA.textPrimary, fontFamily: 'Open Sans' }}>{r.value}%</span>
                </div>
              ))}
            </>
          )}
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
