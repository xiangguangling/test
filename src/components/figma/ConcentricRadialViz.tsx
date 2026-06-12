import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA } from './figmaTheme';
import { useFigmaEchart } from './useFigmaEchart';
import { getUrbanRuralConcentricInsight } from '../ChartInsights';

const W = 973;
const H = 857;
const W_HERO = 280;
const H_HERO = 240;

export default function ConcentricRadialViz({
  data,
  hero = false,
}: {
  data: DashboardData;
  hero?: boolean;
}) {
  const dw = hero ? W_HERO : W;
  const dh = hero ? H_HERO : H;
  const rings = useMemo(() => {
    const urban = data.by_urban_rural;
    return [
      { name: '城市', value: +((urban['城市']?.avg_rate ?? 0) * 100).toFixed(1), color: FIGMA.purple },
      { name: '县镇', value: +((urban['县镇']?.avg_rate ?? 0) * 100).toFixed(1), color: FIGMA.pink },
      { name: '农村', value: +((urban['农村']?.avg_rate ?? 0) * 100).toFixed(1), color: FIGMA.cyan },
    ];
  }, [data]);

  /** 中心：按学校数加权的城乡综合得分率（与外圈三类对应） */
  const centerRate = useMemo(() => {
    const urban = data.by_urban_rural;
    const types = ['城市', '县镇', '农村'] as const;
    let total = 0;
    let sum = 0;
    for (const t of types) {
      const s = urban[t];
      if (!s?.count) continue;
      total += s.count;
      sum += s.avg_rate * s.count;
    }
    return total > 0 ? sum / total : data.overall.avg_rate;
  }, [data]);

  const centerPct = +(centerRate * 100).toFixed(1);

  const ringWidth = hero ? 7 : 14;
  const chartRef = useFigmaEchart({
    series: [
      ...rings.map((r, i) => ({
        type: 'gauge' as const,
        center: ['50%', hero ? '52%' : '50%'],
        radius: `${(hero ? 72 : 78) - i * (hero ? 14 : 16)}%`,
        startAngle: 210,
        endAngle: -30,
        min: 80,
        max: 100,
        pointer: { show: false },
        progress: { show: true, width: ringWidth, roundCap: true, itemStyle: { color: r.color } },
        axisLine: { lineStyle: { width: ringWidth, color: [[1, hero ? '#F2F5FA' : 'rgba(141,119,126,0.12)']] as [number, string][] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: r.value }],
      })),
      {
        type: 'gauge',
        center: ['50%', hero ? '52%' : '50%'],
        radius: hero ? '28%' : '22%',
        pointer: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          fontSize: hero ? 26 : 32,
          fontWeight: 700,
          fontFamily: 'Open Sans',
          color: FIGMA.textPrimary,
          formatter: (value: number) => `${value.toFixed(1)}%`,
        },
        data: [{ value: centerPct }],
      },
    ],
    tooltip: { show: false },
  }, [data, rings, hero, centerPct]);

  return (
    <ChartCard
      title="城乡三类区域得分率"
      className={hero ? 'chart-card--compact concentric-viz--hero' : ''}
      insight={getUrbanRuralConcentricInsight(data)}
    >
      <FigmaScaledCanvas designWidth={dw} designHeight={dh} fillHeight={hero}>
        <div style={{ position: 'relative', width: dw, height: dh }}>
          <div ref={chartRef} style={{
            position: 'absolute',
            left: hero ? 8 : 0,
            top: hero ? 14 : 0,
            width: hero ? dw - 16 : dw,
            height: hero ? dh - 28 : dh,
          }} />
          {hero ? (
            <div style={{
              position: 'absolute', left: 8, right: 8, bottom: 8,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {rings.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ color: FIGMA.textSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ fontWeight: 600, color: FIGMA.textPrimary }}>{r.value}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ position: 'absolute', left: '50%', bottom: 48, transform: 'translateX(-50%)', display: 'flex', gap: 24 }}>
              {rings.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color }} />
                  <span style={{ fontSize: 13, color: FIGMA.textSecondary }}>{r.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: FIGMA.textPrimary }}>{r.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
