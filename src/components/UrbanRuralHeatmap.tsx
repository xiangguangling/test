import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getUrbanRuralHeatmapInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';
import { buildHeatmapVisualMap, buildHeatmapLabelStyle } from '../utils/heatmapVisualMap';

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

const shortNames: Record<string, string> = {
  'B1.1-④公共教学用房得分率': '公共教学用房',
  'B5.1-③生机比得分率': '生机比',
  'C2.3-①得分率': '中高级职称',
  'B1.1-③专用教室面积得分率': '专用教室面积',
  'C1.1-①得分率': '教职工数',
  'C1.2-①得分率': '生师比',
  'B2.1-②校园生活服务用房得分率': '生活用房',
  'C4.1-①得分率': '音体美教师',
  'B1.2-②生均用地面积得分率': '用地面积',
  'B2.1-①校园办公用房面积得分率': '办公用房',
  'B5.1-②师机比得分率': '师机比',
  'C2.1-①得分率': '教师资格证',
  'B7.1-①生均绿地面积得分率': '绿地面积',
  'C2.2-①得分率': '教师学历',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积',
  'C1.3-①得分率': '骨干教师',
  'B3.1-①生均图书册数得分率': '图书册数',
  'A1.2得分率': '学生总数',
  'A2.2.1得分率': '食堂达标',
  'A3.2.1得分率': '保卫人员',
  'B6.1-②篮、排球场地得分率': '篮排球场地',
  'B6.1-③跑道长度得分率': '跑道长度',
  'C6.2-①得分率': '体质健康',
  'C5.1-①得分率': '心理教师',
};

export default function UrbanRuralHeatmap({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
        // Pick indicators with most variance across urban/rural
    const areas = ['城市', '县镇', '农村'];
    const varianceData: { key: string; variance: number }[] = [];

    for (const ind of data.indicators) {
      if (ind.key === '得分率' || !data.urban_rural_analysis) continue;
      const vals = areas.map(a => data.urban_rural_analysis[a]?.[ind.key] ?? 0);
      if (vals.every(v => v === 0)) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
      varianceData.push({ key: ind.key, variance });
    }

    const topIndicators = varianceData
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 10);

    const heatData: [number, number, number][] = [];
    const yLabels: string[] = topIndicators.map(d => shortNames[d.key] || d.key);
    const xLabels = areas;

    topIndicators.forEach((item, yi) => {
      areas.forEach((area, xi) => {
        const val = data.urban_rural_analysis[area]?.[item.key] ?? 0;
        heatData.push([xi, yi, +(val * 100).toFixed(1)]);
      });
    });

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: (params: unknown) => {
          const p = params as { value: [number, number, number] };
          return `${xLabels[p.value[0]]} · ${yLabels[p.value[1]]}<br/>得分率: <b>${p.value[2]}%</b>`;
        },
      },
      grid: {
        left: compact ? '26%' : '22%',
        right: compact ? '18%' : '14%',
        top: compact ? '2%' : '3%',
        bottom: compact ? '4%' : '6%',
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: { color: '#383874', fontSize: compact ? 10 : 12, fontWeight: 'bold', margin: compact ? 6 : 10 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#DBDFF1' } },
        splitArea: { show: true, areaStyle: { color: ['#FAFBFD', '#F2F5FA'] } },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        axisLabel: { color: '#9292C1', fontSize: compact ? 8 : 10, width: compact ? 56 : 80, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      visualMap: buildHeatmapVisualMap(heatData, {
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemWidth: compact ? 10 : 12,
        itemHeight: compact ? 72 : 100,
      }),
      series: [
        {
          type: 'heatmap',
          data: heatData,
          label: buildHeatmapLabelStyle(compact ? 9 : 11),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 212, 255, 0.5)',
            },
          },
          itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: '#FFFFFF',
          },
        },
      ],
    };

    const chart = mountEcharts(chartRef.current, option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, compact]);

  const insight = getUrbanRuralHeatmapInsight(data);

  return (
    <FlipCard
      front={
        <div className="card-border glow-cyan p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-accent-cyan">🌐</span>
            城乡差异最大十项指标
          </h3>
          <div className="overview-chart-body">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
