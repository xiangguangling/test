import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA_CARD_STYLE, SCHOOL_TYPE_COLORS, SCHOOL_TYPES } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';
import { getStackedBarInsight } from '../ChartInsights';

const W = 1070;
const H = 527;
/** 线性缩放 0.5 → 面积约 1/4 */
const W_COMPACT = Math.round(W / 2);
const H_COMPACT = Math.round(H / 2);

export default function StackedBarViz({
  data,
  compact = false,
  fillHeight = false,
}: {
  data: DashboardData;
  compact?: boolean;
  fillHeight?: boolean;
}) {
  const dist = data.score_distribution;
  const xLabels = dist.map(d => d.score.toString());
  const dw = compact ? W_COMPACT : W;
  const dh = compact ? H_COMPACT : H;

  const { series, maxVal } = useMemo(() => {
    const total = dist.reduce((s, d) => s + d.count, 0);
    const s = SCHOOL_TYPES.map((t, ti) => {
      const ratio = (data.by_school_type[t]?.count || 0) / total;
      return {
        name: t,
        type: 'bar' as const,
        stack: 'total',
        barWidth: compact ? 6 : 8,
        itemStyle: { color: SCHOOL_TYPE_COLORS[ti], borderRadius: ti === 2 ? [4, 4, 0, 0] : 0 },
        data: dist.map(d => Math.round(d.count * ratio)),
      };
    });
    const maxVal = Math.max(...dist.map(d => d.count), 1);
    return { series: s, maxVal };
  }, [data, dist, compact]);

  const chartRef = useFigmaEchart({
    grid: compact
      ? { left: 40, right: 12, top: 12, bottom: 28 }
      : { left: 56, right: 24, top: 28, bottom: 36 },
    xAxis: {
      type: 'category',
      data: xLabels,
      ...figmaAxisStyle(),
      axisLabel: { color: '#9292C1', fontSize: compact ? 9 : 12 },
    },
    yAxis: {
      type: 'value',
      max: Math.ceil(maxVal / 50) * 50,
      ...figmaAxisStyle(),
      axisLabel: { color: '#9292C1', fontSize: compact ? 9 : 12 },
    },
    legend: compact
      ? {
          data: [...SCHOOL_TYPES],
          top: 0,
          right: 0,
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: '#9292C1', fontSize: 9 },
        }
      : undefined,
    series,
    tooltip: { trigger: 'axis' },
  }, [data, series, xLabels, maxVal, compact]);

  const chartInset = compact
    ? { left: 16, top: 28, width: dw - 32, height: dh - 40 }
    : { left: 30, top: 68, width: dw - 60, height: dh - 90 };

  return (
    <ChartCard title="三类学校分数段构成" className={compact ? 'chart-card--fill chart-card--compact' : ''} insight={getStackedBarInsight(data)}>
      <FigmaScaledCanvas designWidth={dw} designHeight={dh} fillHeight={fillHeight}>
        <div style={{ ...FIGMA_CARD_STYLE, borderRadius: compact ? 10 : FIGMA_CARD_STYLE.borderRadius }}>
          {!compact && (
            <div style={{ position: 'absolute', left: 30, top: 20, display: 'flex', alignItems: 'center', gap: 32 }}>
              {SCHOOL_TYPES.map((t, i) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: SCHOOL_TYPE_COLORS[i] }} />
                  <span style={{ fontSize: 14, color: '#9292C1', fontFamily: 'Roboto' }}>{t}</span>
                </div>
              ))}
            </div>
          )}
          <div
            ref={chartRef}
            style={{
              position: 'absolute',
              left: chartInset.left,
              top: chartInset.top,
              width: chartInset.width,
              height: chartInset.height,
            }}
          />
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
