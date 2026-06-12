import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, FIGMA_RADAR_DISCS } from './figmaTheme';
import { useFigmaEchart } from './useFigmaEchart';
import type { FigmaRadarSeries } from './figmaRadarData';
import type { ChartInsight } from '../ChartInsights';

/** Figma 玫瑰图-RoseChart.html 实际为雷达图，原始画布 */
export const FIGMA_RADAR_W = 857.48;
export const FIGMA_RADAR_H = 635.42;

const SERIES_STYLE = [
  {
    line: '#7D40FF',
    dotBorder: '#7D40FF',
    area: [['rgba(108, 73, 172, 0.22)', 'rgba(9, 99, 205, 0.08)'] as const],
  },
  {
    line: '#F278A1',
    dotBorder: '#EE7CAF',
    area: [['rgba(242, 120, 161, 0.22)', 'rgba(226, 138, 223, 0.08)'] as const],
  },
  {
    line: '#66C8FF',
    dotBorder: '#66C8FF',
    area: [['rgba(102, 200, 255, 0.2)', 'rgba(102, 200, 255, 0.06)'] as const],
  },
];

function RadarDiscBackground({ scale }: { scale: number }) {
  const outer = FIGMA_RADAR_DISCS[0] * scale;
  const wrap: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: outer,
    height: outer,
    pointerEvents: 'none',
    zIndex: 0,
  };

  return (
    <div style={wrap} aria-hidden>
      {FIGMA_RADAR_DISCS.map((size, i) => {
        const s = size * scale;
        return (
          <div
            key={size}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: s,
              height: s,
              marginLeft: -s / 2,
              marginTop: -s / 2,
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: FIGMA.radarDiscShadow,
              zIndex: i,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: outer,
          height: outer,
          marginLeft: -outer / 2,
          marginTop: -outer / 2,
          borderRadius: '50%',
          border: '1.1px solid #DCDCDC',
          background: 'transparent',
          zIndex: FIGMA_RADAR_DISCS.length,
        }}
      />
    </div>
  );
}

interface FigmaRadarChartPanelProps {
  title: string;
  indicators: string[];
  series: FigmaRadarSeries[];
  className?: string;
  scaleBoost?: number;
  fillAxis?: 'contain' | 'height' | 'width';
  compact?: boolean;
  insight?: ChartInsight;
}

export default function FigmaRadarChartPanel({
  title,
  indicators,
  series,
  className = '',
  scaleBoost = 1,
  fillAxis = 'contain',
  compact = false,
  insight,
}: FigmaRadarChartPanelProps) {
  const isRichLabels = series.length === 1;
  /** 单系列带指标名+数值时，缩小雷达为轴标签留出上下空间 */
  const radiusScale = isRichLabels ? (compact ? 0.62 : 0.66) : 0.82;
  const radarRadius = `${Math.round(radiusScale * 92)}%`;
  const chartPad = isRichLabels
    ? compact
      ? { top: 60, right: 50, bottom: 60, left: 50 }
      : { top: 48, right: 36, bottom: 52, left: 36 }
    : { top: 32, right: 28, bottom: 36, left: 28 };

  const option = useMemo(() => {
    const primary = series[0]?.values ?? [];
    return {
      backgroundColor: 'transparent',
      legend: series.length > 1 ? {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: FIGMA.textMuted, fontSize: 12, fontFamily: 'Roboto' },
        data: series.map(s => s.name),
      } : undefined,
      radar: {
        center: ['50%', '50%'],
        radius: radarRadius,
        startAngle: 90,
        splitNumber: 1,
        shape: 'circle' as const,
        indicator: indicators.map((name, i) => ({
          name: isRichLabels && primary[i] != null
            ? `{dim|${name}}\n{val|${(primary[i] * 100).toFixed(1)}%}`
            : name,
          max: 1,
        })),
        axisNameGap: isRichLabels ? 6 : 10,
        axisName: {
          color: '#000',
          fontFamily: 'Open Sans, sans-serif',
          rich: {
            dim: { fontSize: compact && isRichLabels ? 32 : (isRichLabels ? 18 : 16), fontWeight: 400, color: '#000', lineHeight: compact && isRichLabels ? 38 : 22 },
            val: { fontSize: compact && isRichLabels ? 38 : (isRichLabels ? 20 : 18), fontWeight: 700, color: '#000', lineHeight: compact && isRichLabels ? 44 : 24 },
          },
        },
        splitLine: { show: false },
        splitArea: { show: false },
        axisLine: {
          show: true,
          lineStyle: { color: '#D1D1F4', width: 0.85 },
        },
      },
      series: series.map((s, si) => {
        const style = SERIES_STYLE[si % SERIES_STYLE.length];
        const [c0] = style.area[0];
        return {
          type: 'radar' as const,
          name: s.name,
          z: 10 + si,
          data: [{ value: s.values, name: s.name }],
          symbol: 'circle',
          symbolSize: isRichLabels ? 8 : 10,
          itemStyle: {
            color: '#fff',
            borderColor: style.dotBorder,
            borderWidth: 3,
          },
          lineStyle: {
            width: isRichLabels ? 3 : 4,
            color: style.line,
            cap: 'round' as const,
            join: 'round' as const,
          },
          areaStyle: {
            opacity: 0.42,
            color: c0,
          },
        };
      }),
      tooltip: {
        trigger: 'item' as const,
        formatter: (p: unknown) => {
          const x = p as { name: string; value: number[] };
          const lines = indicators.map((ind, i) =>
            `${ind}: ${((x.value[i] ?? 0) * 100).toFixed(1)}%`,
          );
          return `<b>${x.name}</b><br/>${lines.join('<br/>')}`;
        },
      },
    };
  }, [indicators, series, isRichLabels, radarRadius]);

  const chartRef = useFigmaEchart(option, [indicators, series, isRichLabels, radarRadius]);

  return (
    <ChartCard title={title} className={`chart-card--radar ${className}`.trim()} insight={insight}>
      <FigmaScaledCanvas
        designWidth={FIGMA_RADAR_W}
        designHeight={FIGMA_RADAR_H}
        fillHeight
        scaleBoost={scaleBoost}
        fillAxis={fillAxis}
      >
        <div style={{
          width: FIGMA_RADAR_W,
          height: FIGMA_RADAR_H,
          position: 'relative',
          background: FIGMA.bgCard,
          boxSizing: 'border-box',
          padding: `${chartPad.top}px ${chartPad.right}px ${chartPad.bottom}px ${chartPad.left}px`,
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
              ref={chartRef}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
              }}
            />
            <RadarDiscBackground scale={radiusScale} />
          </div>
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
