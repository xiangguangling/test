import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getSchoolTypeComparisonInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';
import { buildSideLegend, buildBottomLegend, buildSideLegendGrid } from '../utils/chartLegend';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export default function SchoolTypeComparison({
  data,
  inline = false,
}: {
  data: DashboardData;
  inline?: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const insight = getSchoolTypeComparisonInsight(data);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    let chart: echarts.ECharts | null = null;
    let disposed = false;
    let rafId = 0;

    const categoryMap: Record<string, string> = {
      'A类-学校管理与安全': 'A. 学校管理与安全\n(11分)',
      'B类-办学硬件与环境': 'B. 办学硬件与环境\n(20分)',
      'C类-师资队伍与发展': 'C. 师资队伍与发展\n(13分)',
    };

    const categories = Object.keys(categoryMap);
    const schoolTypes = ['小学', '初中', '九年制'];

    const seriesData = schoolTypes.map((st, si) => {
      const colors = ['#8676FF', '#FF708B', '#66C8FF'];
      const colorsLight = ['#8676FF', '#FF708B', '#66C8FF'];
      const values = categories.map(cat => {
        const rate = data.category_summary[cat]?.[st] ?? 0;
        return +(rate * 100).toFixed(1);
      });
      return {
        name: st,
        type: 'bar' as const,
        data: values,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[si] },
            { offset: 1, color: colorsLight[si] + '44' },
          ]),
        },
        emphasis: {
          itemStyle: { color: colors[si] },
        },
        barGap: '30%',
        label: {
          show: true,
          position: 'top',
          color: '#383874',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: '{c}%',
        },
      };
    });

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
          const p = params as { seriesName: string; value: number; axisValue: string }[];
          if (!p?.length) return '';
          return `<b>${p[0].axisValue.replace('\n', ' ')}</b><br/>` +
            p.map(item =>
              `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.seriesName === '小学' ? '#8676FF' : item.seriesName === '初中' ? '#FF708B' : '#66C8FF'};margin-right:4px;"></span>${item.seriesName}: <b>${item.value}%</b>`
            ).join('<br/>');
        },
      },
      legend: inline
        ? buildBottomLegend(schoolTypes, { fontSize: 10, bottom: 4, itemGap: 14 })
        : buildSideLegend(schoolTypes, { fontSize: 11 }),
      grid: inline
        ? { left: '10%', right: '6%', top: '10%', bottom: '16%', containLabel: true }
        : buildSideLegendGrid({ top: '6%' }),
      xAxis: {
        type: 'category',
        data: Object.values(categoryMap),
        axisLabel: { color: '#9292C1', fontSize: 11 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#DBDFF1' } },
      },
      yAxis: {
        type: 'value',
        name: '得分率 (%)',
        max: 100,
        nameTextStyle: { color: '#9292C1', fontSize: 10 },
        axisLabel: { color: '#9292C1', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
      },
      series: seriesData,
    };

    const handleResize = () => chart?.resize();

    const init = () => {
      if (disposed || !chartRef.current) return;
      const { clientWidth, clientHeight } = chartRef.current;
      if (clientWidth < 2 || clientHeight < 2) {
        rafId = requestAnimationFrame(init);
        return;
      }

      chart = mountEcharts(chartRef.current, option, undefined, { skipRevealWait: true });
      chart.resize();
      window.addEventListener('resize', handleResize);
    };

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      chart?.dispose();
    };
  }, [data, inline]);

  return (
    <FlipCard
      front={
        <div className={`card-border glow-blue relative overview-chart-card${inline ? ' overview-chart-card--inline-bar chart-card--compact' : ''}`}>
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <div className="chart-card-title">三类学校三大维度对比</div>
            </div>
          </div>
          <div className="overview-chart-body chart-card-body">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
