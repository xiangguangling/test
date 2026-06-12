import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getScoreDistributionInsight } from './ChartInsights';
import { mountEcharts, withChartAnimation } from '../utils/chartResize';

echarts.use([BarChart, ScatterChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer]);

export default function ScoreDistribution({ data }: { data: DashboardData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const insight = getScoreDistributionInsight(data);

  useEffect(() => {
    if (!chartRef.current) return;

    const types = ['小学', '初中', '九年制'] as const;
    const typeColors: Record<string, string> = { '小学': '#ff6b2b', '初中': '#3b82f6', '九年制': '#22c45e' };

    // 从 score_distribution（真实855所学校分数分布）生成散点
    // x=分数(真实), y=得分率(分数/44), 按办学类型比例分配
    const totalCounts = { '小学': data.by_school_type['小学']?.count || 0, '初中': data.by_school_type['初中']?.count || 0, '九年制': data.by_school_type['九年制']?.count || 0 };
    const totalAll = totalCounts['小学'] + totalCounts['初中'] + totalCounts['九年制'];
    const typePool: string[] = [];
    for (const t of types) {
      for (let i = 0; i < totalCounts[t]; i++) typePool.push(t);
    }
    // shuffle
    for (let i = typePool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [typePool[i], typePool[j]] = [typePool[j], typePool[i]]; }
    let poolIdx = 0;

    const scatterPoints: Record<string, [number, number][]> = { '小学': [], '初中': [], '九年制': [] };
    const dist = data.score_distribution;

    for (const d of dist) {
      if (d.count <= 0) continue;
      const rate = Math.min(1, d.score / 44);
      for (let i = 0; i < d.count; i++) {
        const t = typePool[poolIdx % typePool.length];
        poolIdx++;
        // 极小抖动避免完全重叠，得分率上限 100%
        const jx = (Math.random() - 0.5) * 0.8;
        const jy = (Math.random() - 0.5) * 0.006;
        const x = Math.min(44, Math.max(34, d.score + jx));
        const y = Math.min(1, Math.max(0, rate + jy));
        scatterPoints[t].push([+x.toFixed(1), +y.toFixed(3)]);
      }
    }

    // Bar: 真实平均值
    const barValues = types.map(t => {
      const s = data.by_school_type[t];
      return {
        value: s ? +(s.avg_rate * 100).toFixed(1) : 0,
        groupId: t,
        itemStyle: { color: typeColors[t], borderRadius: [6, 6, 0, 0] },
      };
    });

    const scatterOption: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      animationDurationUpdate: 2000,
      animationEasingUpdate: 'cubicInOut',
      title: {
        text: '855所学校总分分布 · 得分率散点 (点击看柱状聚合)',
        left: 'center', top: 8,
        textStyle: { color: '#9292C1', fontSize: 11, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 11 },
        formatter: (p: unknown) => {
          const pa = p as { seriesName: string; value: [number, number] };
          return `${pa.seriesName}<br/>总分: <b>${pa.value[0]}</b> / 44<br/>得分率: <b>${(pa.value[1] * 100).toFixed(1)}%</b>`;
        },
      },
      legend: { data: [...types], bottom: 0, textStyle: { color: '#9292C1', fontSize: 10 } },
      grid: { left: '8%', right: '6%', top: '14%', bottom: '12%' },
      xAxis: { type: 'value', name: '学校总分（满分44）', nameTextStyle: { color: '#9292C1', fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 9 }, splitLine: { lineStyle: { color: '#F2F5FA' } }, min: 34, max: 44 },
      yAxis: { type: 'value', name: '得分率', nameTextStyle: { color: '#9292C1', fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } }, min: 0.75, max: 1 },
      series: types.map(t => ({
        type: 'scatter',
        id: t,
        name: t,
        dataGroupId: t,
        symbolSize: 7,
        animationDurationUpdate: 2000,
        animationEasingUpdate: 'cubicInOut',
        itemStyle: { color: typeColors[t] + '66', borderColor: typeColors[t], borderWidth: 0.5 },
        universalTransition: { enabled: true, divideShape: 'clone' },
        data: scatterPoints[t],
      })),
    };

    const barOption: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      animationDurationUpdate: 2000,
      animationEasingUpdate: 'cubicInOut',
      title: {
        text: '各办学类型 · 平均得分率对比 (点击看散点分布)',
        left: 'center', top: 8,
        textStyle: { color: '#9292C1', fontSize: 11, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 11 },
      },
      legend: { data: [...types], bottom: 0, textStyle: { color: '#9292C1', fontSize: 10 } },
      grid: { left: '8%', right: '6%', top: '14%', bottom: '12%' },
      xAxis: { type: 'category', data: types, axisLabel: { color: '#383874', fontSize: 12 }, axisTick: { show: false } },
      yAxis: { type: 'value', name: '平均得分率', nameTextStyle: { color: '#9292C1', fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#F2F5FA' } }, min: 80, max: 100 },
      series: [{
        type: 'bar',
        id: 'total',
        barWidth: '40%',
        animationDurationUpdate: 2000,
        animationEasingUpdate: 'cubicInOut',
        universalTransition: { enabled: true, seriesKey: [...types], divideShape: 'clone' },
        data: barValues.map(d => ({ value: d.value, groupId: d.groupId, itemStyle: { color: d.itemStyle.color, borderRadius: [6, 6, 0, 0] } })),
        label: { show: true, position: 'top', color: '#383874', fontSize: 14, fontWeight: 'bold', formatter: '{c}%' },
      }],
    };

    const animatedScatter = withChartAnimation(scatterOption);
    const animatedBar = withChartAnimation(barOption);
    const chart = mountEcharts(chartRef.current, animatedScatter);
    let currentOption = animatedScatter;

    const handleClick = () => {
      currentOption = currentOption === animatedScatter ? animatedBar : animatedScatter;
      chart.setOption(currentOption, true);
    };
    chart.on('click', handleClick);

    const timer = setInterval(() => {
      currentOption = currentOption === animatedScatter ? animatedBar : animatedScatter;
      chart.setOption(currentOption, true);
    }, 5000);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(timer);
      chart.off('click', handleClick);
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <FlipCard
      front={
        <div className="card-border glow-blue p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-accent-blue">📈</span>
            {data.overall.total_schools}所学校总分分布
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
