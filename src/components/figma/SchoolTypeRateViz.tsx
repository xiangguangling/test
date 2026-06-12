import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import type { DashboardData } from '../../types';
import ChartCard from '../ChartCard';
import { getSchoolTypeRateInsight } from '../ChartInsights';
import { mountEcharts, withChartAnimation } from '../../utils/chartResize';

echarts.use([
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

/** 与参考页一致的 seriesKey / groupId 键（勿用中文，避免 universalTransition 匹配异常） */
const TYPE_DEFS = [
  { key: 'primary', label: '小学', color: '#ff6b2b' },
  { key: 'junior', label: '初中', color: '#3b82f6' },
  { key: 'nineYear', label: '九年制', color: '#22c45e' },
] as const;

const SERIES_KEYS = TYPE_DEFS.map(d => d.key);

const scatterTransitionDelay = () => Math.random() * 400;

function buildScatterPoints(data: DashboardData) {
  const typePool: string[] = [];
  for (const { label } of TYPE_DEFS) {
    const count = data.by_school_type[label]?.count || 0;
    for (let i = 0; i < count; i++) typePool.push(label);
  }
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
  }

  const scatterPoints: Record<string, [number, number][]> = {
    小学: [],
    初中: [],
    九年制: [],
  };
  let poolIdx = 0;

  for (const d of data.score_distribution) {
    if (d.count <= 0) continue;
    const rate = Math.min(1, d.score / 44);
    for (let i = 0; i < d.count; i++) {
      const t = typePool[poolIdx % typePool.length];
      poolIdx++;
      const jx = (Math.random() - 0.5) * 0.8;
      const jy = (Math.random() - 0.5) * 0.006;
      const x = Math.min(44, Math.max(34, d.score + jx));
      const y = Math.min(1, Math.max(0, rate + jy));
      scatterPoints[t].push([+x.toFixed(1), +y.toFixed(3)]);
    }
  }

  return scatterPoints;
}

export default function SchoolTypeRateViz({
  data,
  compact = false,
}: {
  data: DashboardData;
  compact?: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const scatterPoints = useMemo(() => buildScatterPoints(data), [data]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    let chart: echarts.ECharts | null = null;
    let disposed = false;
    let rafId = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const grid = compact
      ? { left: 8, right: 8, top: 24, bottom: 32, containLabel: true }
      : { left: '8%', right: '6%', top: '14%', bottom: '14%', containLabel: true };

    const barValues = TYPE_DEFS.map(({ key, label, color }) => {
      const s = data.by_school_type[label];
      return {
        value: s ? +(s.avg_rate * 100).toFixed(1) : 0,
        groupId: key,
        itemStyle: {
          color,
          borderRadius: [compact ? 4 : 6, compact ? 4 : 6, 0, 0] as [number, number, number, number],
        },
      };
    });

    const scatterOption: EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: compact ? 10 : 11 },
        formatter: (p: unknown) => {
          const pa = p as { seriesName: string; value: [number, number] };
          return `${pa.seriesName}<br/>总分: <b>${pa.value[0]}</b> / 44<br/>得分率: <b>${(pa.value[1] * 100).toFixed(1)}%</b>`;
        },
      },
      legend: {
        data: TYPE_DEFS.map(d => d.label),
        bottom: 4,
        itemWidth: compact ? 8 : 12,
        itemHeight: compact ? 8 : 12,
        textStyle: { color: '#9292C1', fontSize: compact ? 9 : 10 },
      },
      grid,
      xAxis: {
        type: 'value',
        name: compact ? '' : '学校总分（满分44）',
        nameGap: compact ? 6 : 10,
        nameTextStyle: { color: '#9292C1', fontSize: compact ? 8 : 10 },
        axisLabel: { color: '#9292C1', fontSize: compact ? 8 : 9 },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
        min: 34,
        max: 44,
      },
      yAxis: {
        type: 'value',
        name: compact ? '' : '得分率',
        nameGap: compact ? 6 : 10,
        nameTextStyle: { color: '#9292C1', fontSize: compact ? 8 : 10 },
        axisLabel: {
          color: '#9292C1',
          fontSize: compact ? 8 : 9,
          formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
        },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
        min: 0.75,
        max: 1,
      },
      series: TYPE_DEFS.map(({ key, label, color }) => ({
        type: 'scatter',
        id: key,
        name: label,
        dataGroupId: key,
        symbolSize: compact ? 6 : 10,
        itemStyle: {
          color,
          borderColor: color,
          borderWidth: 0.5,
          opacity: 0.85,
        },
        universalTransition: {
          enabled: true,
          delay: scatterTransitionDelay,
        },
        data: scatterPoints[label],
      })),
    };

    const barOption: EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: compact ? 10 : 11 },
      },
      legend: {
        data: TYPE_DEFS.map(d => d.label),
        bottom: 4,
        itemWidth: compact ? 8 : 12,
        itemHeight: compact ? 8 : 12,
        textStyle: { color: '#9292C1', fontSize: compact ? 9 : 10 },
      },
      grid,
      xAxis: {
        type: 'category',
        data: TYPE_DEFS.map(d => d.label),
        axisLabel: { color: '#383874', fontSize: compact ? 10 : 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: compact ? '' : '平均得分率',
        nameGap: compact ? 6 : 10,
        nameTextStyle: { color: '#9292C1', fontSize: 10 },
        axisLabel: { color: '#9292C1', fontSize: compact ? 8 : 9, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
        min: 80,
        max: 100,
      },
      series: [{
        type: 'bar',
        id: 'total',
        barWidth: compact ? '48%' : '40%',
        universalTransition: {
          enabled: true,
          seriesKey: [...SERIES_KEYS],
          delay: scatterTransitionDelay,
        },
        data: barValues,
        label: {
          show: true,
          position: 'top',
          distance: compact ? 2 : 4,
          color: '#383874',
          fontSize: compact ? 10 : 14,
          fontWeight: 'bold',
          formatter: '{c}%',
        },
      }],
    };

    const init = () => {
      if (disposed || !chartRef.current) return;
      const { clientWidth, clientHeight } = chartRef.current;
      if (clientWidth < 2 || clientHeight < 2) {
        rafId = requestAnimationFrame(init);
        return;
      }

      const animatedScatter = withChartAnimation(scatterOption);
      const animatedBar = withChartAnimation(barOption);
      chart = mountEcharts(chartRef.current, animatedScatter);
      let currentOption: EChartsCoreOption = animatedScatter;

      const toggle = () => {
        currentOption = currentOption === animatedScatter ? animatedBar : animatedScatter;
        chart?.setOption(currentOption, true);
      };

      chart.on('click', toggle);
      timer = setInterval(toggle, 3500);

      chart.resize();
    };

    init();

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timer) clearInterval(timer);
      chart?.dispose();
    };
  }, [data, compact, scatterPoints]);

  return (
    <ChartCard title="三类学校平均得分率" className={compact ? 'chart-card--compact' : ''} insight={getSchoolTypeRateInsight(data)}>
      <div
        ref={chartRef}
        className="chart-echarts-host"
        style={{
          width: '100%',
          height: compact ? '100%' : undefined,
          minHeight: compact ? 0 : 280,
          cursor: 'pointer',
        }}
      />
    </ChartCard>
  );
}
