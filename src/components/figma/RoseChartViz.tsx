import { useMemo } from 'react';
import type { DashboardData } from '../../types';
import FigmaRadarChartPanel from './FigmaRadarChartPanel';
import { buildOverviewRadar } from './figmaRadarData';
import { getTop6WeaknessRadarInsight } from '../ChartInsights';

export default function RoseChartViz({
  data,
  hero = false,
  heroHalf = false,
}: {
  data: DashboardData;
  hero?: boolean;
  /** 卡片占半宽时放大画布，保持雷达图视觉尺寸 */
  heroHalf?: boolean;
}) {
  const radar = useMemo(() => buildOverviewRadar(data), [data]);

  return (
    <FigmaRadarChartPanel
      title="六项核心指标得分"
      indicators={radar.indicators}
      series={radar.series}
      className={`chart-card--radar${hero || heroHalf ? ' chart-card--fill' : ''}${heroHalf ? ' chart-card--rose-half' : ''}`}
      fillAxis={heroHalf ? 'width' : 'contain'}
      scaleBoost={heroHalf ? 1.8 : 1}
      compact={false}
      insight={getTop6WeaknessRadarInsight(data)}
    />
  );
}
