import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getWeaknessBarsInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const shortNames: Record<string, string> = {
  'B1.1-④公共教学用房得分率': '公共教学用房（图书馆/心理室/体育室等）',
  'B5.1-③生机比得分率': '生机比（学生终端配比）',
  'C2.3-①得分率': '中高级职称教师比例',
  'B1.1-③专用教室面积得分率': '专用教室面积（科学/音乐/美术等）',
  'C1.1-①得分率': '学校教职工数达标',
  'C1.2-①得分率': '学校生师比',
  'B2.1-②校园生活服务用房得分率': '校园生活服务用房（宿舍/食堂等）',
  'C4.1-①得分率': '体育艺术专任教师配备',
  'B1.2-②生均用地面积得分率': '生均用地面积',
  'B2.1-①校园办公用房面积得分率': '行政办公用房达标',
  'B5.1-②师机比得分率': '师机比（教师终端配比）',
  'C2.1-①得分率': '教师资格证书持证率',
  'B7.1-①生均绿地面积得分率': '生均绿地面积',
  'C2.2-①得分率': '专任教师学历达标',
  'B1.2-①生均校舍建筑面积得分率': '生均校舍建筑面积',
};

export default function WeaknessBars({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
        const sorted = [...data.indicators]
      .filter(ind => ind.key !== '得分率' && ind.avg_rate < 0.99)
      .sort((a, b) => a.avg_rate - b.avg_rate)
      .slice(0, 15);

    const names = sorted.map(ind => shortNames[ind.key] || ind.name);
    const rates = sorted.map(ind => +(ind.avg_rate * 100).toFixed(1));

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
          const p = params as { name: string; value: number; seriesName: string }[];
          if (!p || !p.length) return '';
          if (p.length === 1) {
            return `<b>${p[0].name}</b><br/>${p[0].seriesName}: ${p[0].value}%`;
          }
          return `<b>${p[0].name}</b><br/>得分率: ${p[0].value}%<br/>不达标比例: ${p[1].value}%`;
        },
      },
      grid: {
        left: compact ? '2%' : '3%',
        right: compact ? '4%' : '8%',
        top: compact ? '2%' : '3%',
        bottom: compact ? '2%' : '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#9292C1', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          color: '#9292C1',
          fontSize: compact ? 8 : 10,
          width: compact ? 72 : 120,
          overflow: 'truncate',
        },
        axisLine: { show: false },
        axisTick: { show: false },
        inverse: true,
      },
      series: [
        {
          name: '得分率',
          type: 'bar',
          data: rates.map((v) => ({
            value: v,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: v < 50
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#ff5c5c' }, { offset: 1, color: '#ff9f43' },
                  ])
                : v < 80
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#ff9f43' }, { offset: 1, color: '#facc15' },
                  ])
                : new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#facc15' }, { offset: 1, color: '#00e396' },
                  ]),
            },
          })),
          barWidth: compact ? 10 : 16,
          label: {
            show: !compact,
            position: 'right',
            color: '#383874',
            fontSize: 10,
            formatter: '{c}%',
          },
          emphasis: {
            itemStyle: { color: '#00d4ff' },
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

  const insight = getWeaknessBarsInsight(data);

  return (
    <FlipCard
      front={
        <div className="card-border glow-orange p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-accent-orange">🔴</span>
            十五项最低得分率指标
          </h3>
          <div className="overview-chart-body">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-muted justify-center overview-chart-footer">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-red" /> 严重不足 (&lt;50%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-orange" /> 需改进 (50-80%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-green" /> 接近达标 (80%+)
            </span>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
