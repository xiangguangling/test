import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getBottomSchoolsListInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export default function BottomSchoolsList({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const insight = getBottomSchoolsListInsight(data);

  useEffect(() => {
    if (!chartRef.current) return;
        const bottom = [...data.bottom_schools].reverse(); // show lowest at bottom
    const names = bottom.map(s => s.name);
    const scores = bottom.map(s => s.score);
    const types = bottom.map(s => s.type);
    const areas = bottom.map(s => s.area);

    const typeColors: Record<string, string> = {
      '小学': '#ff6b2b',
      '初中': '#3b82f6',
      '九年制': '#8b5cf6',
    };

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number }[];
          if (!p?.length) return '';
          const idx = names.indexOf(p[0].name);
          return `<b>${p[0].name}</b><br/>
            总分: <b>${p[0].value}/44</b><br/>
            类型: ${types[idx]}<br/>
            区域: ${areas[idx]}`;
        },
      },
      grid: {
        left: compact ? '2%' : '14%',
        right: compact ? '4%' : '8%',
        top: compact ? '4%' : '5%',
        bottom: compact ? '2%' : '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 34,
        max: 44,
        axisLabel: { color: '#9292C1', fontSize: 10, formatter: '{value}分' },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          color: '#9292C1',
          fontSize: compact ? 8 : 10,
          width: compact ? 52 : 100,
          overflow: 'truncate',
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: scores.map((s, i) => ({
            value: s,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: s <= 37
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#ef4444' }, { offset: 1, color: '#ef444488' },
                  ])
                : s <= 40
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#ff6b2b' }, { offset: 1, color: '#ff6b2b88' },
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#f59e0b' }, { offset: 1, color: '#f59e0b88' },
                  ]),
            },
          })),
          barWidth: compact ? 9 : 14,
          label: {
            show: !compact,
            position: 'right',
            color: '#383874',
            fontSize: 10,
            formatter: '{c}分',
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
            label: {
              color: '#ef4444',
              fontSize: compact ? 9 : 10,
              formatter: '警戒线 {c}分',
              offset: [0, compact ? 14 : 18],
            },
            data: [{ xAxis: 38, name: '警戒线' }],
          },
        },
        {
          type: 'bar',
          data: scores.map((s, i) => ({
            value: 44 - s,
            itemStyle: {
              borderRadius: [4, 0, 0, 4],
              color: 'rgba(239,68,68,0.06)',
            },
          })),
          barWidth: 14,
          barGap: '-100%',
          z: 0,
          tooltip: { show: false },
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

  return (
    <FlipCard
      front={
        <div className="card-border glow-orange p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-accent-red">📋</span>
            得分最低二十所学校
          </h3>
          <div className="overview-chart-body">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-muted justify-center overview-chart-footer">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-red" /> 严重预警 ≤37分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-orange" /> 需关注 38-40分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-yellow" /> 待提升 41-43分
            </span>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
