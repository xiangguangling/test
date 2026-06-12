import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import FigmaScaledCanvas from './FigmaScaledCanvas';
import { FIGMA, FIGMA_CARD_STYLE } from './figmaTheme';
import { figmaAxisStyle, useFigmaEchart } from './useFigmaEchart';
import { getScoreDistributionInsight } from '../ChartInsights';

const W = 290;
const H = 371;
const H_COMPACT = 200;

export default function AreaChartViz({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const dh = compact ? H_COMPACT : H;
  const chartTop = compact ? 120 : 120;
  const dist = data.score_distribution;
  const xLabels = dist.map(d => d.score.toString());
  const yData = dist.map(d => d.count);
  const total = yData.reduce((a, b) => a + b, 0);
  const peak = dist.reduce((a, b) => (b.count > a.count ? b : a), dist[0]);

  const chartRef = useFigmaEchart({
    grid: { left: 8, right: 8, top: compact ? 16 : 8, bottom: 24 },
    xAxis: { type: 'category', data: xLabels, show: false },
    yAxis: { type: 'value', show: false, ...figmaAxisStyle() },
    series: [{
      type: 'line',
      data: yData,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: FIGMA.purple },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(134,118,255,0.35)' },
            { offset: 1, color: 'rgba(134,118,255,0.02)' },
          ],
        },
      },
    }],
    tooltip: { trigger: 'axis' },
  }, [data, xLabels, yData]);

  return (
    <ChartCard title={`${data.overall.total_schools}所学校总分分布`} className={compact ? 'chart-card--compact' : ''} insight={getScoreDistributionInsight(data)}>
      <FigmaScaledCanvas designWidth={W} designHeight={dh} fillHeight={compact}>
        <div style={{ ...FIGMA_CARD_STYLE, borderRadius: 10, height: compact ? '100%' : undefined, display: compact ? 'flex' : 'block', flexDirection: compact ? 'column' : undefined }}>
          {compact ? (
            <>
              <div style={{ padding: '4px 8px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Open Sans', color: FIGMA.textPrimary }}>{total}</div>
                <div style={{ fontSize: 9, color: FIGMA.textSecondary, marginTop: 2 }}>
                  峰值 {peak.score}分 · {peak.count} 所
                </div>
              </div>
              <div ref={chartRef} style={{ flex: 1, width: '100%', minHeight: 0 }} />
            </>
          ) : (
            <>
              <div style={{ position: 'absolute', left: 30, top: 20, width: 229 }}>
                <div style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Poppins', color: FIGMA.textPrimary }}>Total earning</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Open Sans', color: FIGMA.textPrimary, marginTop: 4 }}>{total}</div>
                <div style={{ fontSize: 11, color: FIGMA.textSecondary, marginTop: 4 }}>
                  峰值 {peak.score}分 · {peak.count} 所
                </div>
              </div>
              <div ref={chartRef} style={{ position: 'absolute', left: 20, top: chartTop, width: W - 40, height: dh - 140 }} />
            </>
          )}
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
