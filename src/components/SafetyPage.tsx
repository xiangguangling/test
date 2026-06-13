import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, RadarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, RadarComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import { getSafetyBarInsight, getSafetyRadarInsight } from './ChartInsights';

echarts.use([BarChart, RadarChart, GridComponent, TooltipComponent, LegendComponent, RadarComponent, MarkLineComponent, CanvasRenderer]);

const A_INDICATORS = [
  { key: 'A1.1得分率', name: '班级与班额', group: 'A1.教学规模' },
  { key: 'A1.2得分率', name: '学生总数', group: 'A1.教学规模' },
  { key: 'A2.1得分率', name: '卫生保健室', group: 'A2.校园卫生' },
  { key: 'A2.2.1得分率', name: '食堂达标', group: 'A2.校园卫生' },
  { key: 'A2.2.2得分率', name: '小卖部达标', group: 'A2.校园卫生' },
  { key: 'A2.3.1得分率', name: '饮用水卫生', group: 'A2.校园卫生' },
  { key: 'A2.3.2得分率', name: '厕所卫生', group: 'A2.校园卫生' },
  { key: 'A3.1.2得分率', name: '出入口安全', group: 'A3.校园安全' },
  { key: 'A3.1.1得分率', name: '危房排查', group: 'A3.校园安全' },
  { key: 'A3.2.1得分率', name: '保卫人员', group: 'A3.校园安全' },
  { key: 'A3.2.2得分率', name: '宿舍管理员', group: 'A3.校园安全' },
];

export default function SafetyPage({ data }: { data: DashboardData }) {
  const barRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const gridBarRef = useRef<HTMLDivElement>(null);

  const safetyInds = useMemo(() =>
    A_INDICATORS.map(meta => {
      const ind = data.indicators.find(i => i.key === meta.key);
      return {
        ...meta,
        rate: ind ? +(ind.avg_rate * 100).toFixed(1) : 100,
        fail: ind?.fail_count ?? 0,
        failPct: ind ? +(ind.fail_pct).toFixed(1) : 0,
      };
    }).sort((a, b) => a.rate - b.rate),
  [data]);

  const totalFails = safetyInds.reduce((s, i) => s + i.fail, 0);
  const perfectCount = safetyInds.filter(i => i.rate >= 100).length;
  const worstThree = safetyInds.slice(0, 3);
  const avgSafety = useMemo(() => {
    const vals = Object.values(data.category_summary?.['A类-学校管理与安全'] ?? {});
    if (!vals.length) return 99;
    return +((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100).toFixed(1);
  }, [data]);

  // ===== 柱状图：安全指标得分率排名 =====
  useEffect(() => {
    if (!barRef.current) return;
    const sorted = [...safetyInds].sort((a, b) => a.rate - b.rate);
    const chart = mountEcharts(barRef.current, {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: (p: any) => {
          const d = p?.[0];
          if (!d) return '';
          return `<b>${d.name}</b><br/>得分率: <b style="color:${d.color}">${d.value}%</b><br/>不达标: ${d.data.fail}所 (${d.data.failPct}%)`;
        },
      },
      grid: { left: '3%', right: '8%', top: '6%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        name: '得分率 (%)',
        min: 96,
        max: 100.5,
        nameTextStyle: { color: '#9292C1', fontSize: 10 },
        axisLabel: { color: '#9292C1', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#F2F5FA', type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map(d => d.name),
        axisLabel: { color: '#383874', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        inverse: true,
      },
      series: [{
        type: 'bar',
        barWidth: '50%',
        data: sorted.map(d => {
          const colorStart = d.rate < 98 ? '#FF708B' : d.rate < 99.5 ? '#FFBA69' : '#00B929';
          const colorEnd = d.rate < 98 ? '#FF708B44' : d.rate < 99.5 ? '#FFBA6944' : '#00B92944';
          return {
            value: d.rate,
            fail: d.fail,
            failPct: d.failPct,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: colorStart },
                { offset: 1, color: colorEnd },
              ]),
            },
          };
        }),
        label: {
          show: true,
          position: 'right',
          color: '#383874',
          fontSize: 11,
          fontWeight: 'bold' as const,
          formatter: '{c}%',
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#FF2D2E', type: 'dashed' as const, width: 1.5 },
          label: { color: '#FF2D2E', fontSize: 10, formatter: '警戒线 98%', position: 'start' as const },
          data: [{ xAxis: 98 }],
        },
      }],
    });
    return () => chart.dispose();
  }, [data, safetyInds]);

  // ===== 雷达图：三类学校安全指标对比 =====
  useEffect(() => {
    if (!radarRef.current) return;
    const stypes = ['小学', '初中', '九年制'] as const;
    const scColors = ['#8676FF', '#FF708B', '#66C8FF'];
    const scAreas = ['rgba(134,118,255,0.15)', 'rgba(255,112,139,0.12)', 'rgba(102,200,255,0.12)'];

    const indicator = A_INDICATORS.map(meta => {
      const vals = stypes.map(st => {
        const v = data.cross_analysis[st]?.[meta.key];
        return v != null ? +(v * 100).toFixed(1) : 99;
      });
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);
      // 最外围满分100，不留白
      return { name: meta.name, max: 100 };
    });

    const seriesData = stypes.map((st, si) => ({
      name: st,
      type: 'radar' as const,
      symbol: 'circle' as const,
      symbolSize: 4,
      lineStyle: { color: scColors[si], width: 2 },
      areaStyle: { color: scAreas[si] },
      itemStyle: { color: scColors[si] },
      data: [{
        value: A_INDICATORS.map(meta => {
          const v = data.cross_analysis[st]?.[meta.key];
          return v != null ? +(v * 100).toFixed(3) : 100;
        }),
        name: st,
      }],
    }));

    const chart = mountEcharts(radarRef.current, {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        textStyle: { color: '#383874', fontSize: 12 },
      },
      legend: {
        data: [...stypes],
        bottom: 0,
        textStyle: { color: '#383874', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
      },
      radar: {
        center: ['50%', '46%'],
        radius: '60%',
        indicator,
        axisName: { color: '#383874', fontSize: 10 },
        splitArea: { areaStyle: { color: ['#FAFBFF', '#F2F5FA', '#FAFBFF'] } },
        splitLine: { lineStyle: { color: '#E8ECF4' } },
        axisLine: { lineStyle: { color: '#D0D5E4' } },
      },
      series: seriesData,
    });
    return () => chart.dispose();
  }, [data]);

  // ===== 横向柱状图：三类学校不达标分布 =====
  useEffect(() => {
    if (!gridBarRef.current) return;
    const stypes = ['小学', '初中', '九年制'] as const;
    const stColors = ['#8676FF', '#FF708B', '#66C8FF'];
    const typeCounts: Record<string, number> = {};
    for (const st of stypes) {
      typeCounts[st] = data.by_school_type[st]?.count ?? 1;
    }
    const failByType = A_INDICATORS.map(meta => {
      const vals = stypes.map(st => {
        const rate = data.cross_analysis[st]?.[meta.key] ?? 1;
        return Math.round(typeCounts[st] * (1 - rate));
      });
      return { name: meta.name, vals, total: vals.reduce((a, b) => a + b, 0) };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
    const maxFailVal = Math.max(...failByType.flatMap(d => d.vals), 1);

    const chart = mountEcharts(gridBarRef.current, {
      backgroundColor: 'transparent', animation: true, animationDuration: 1400, animationEasing: 'cubicOut',
      tooltip: { trigger: 'axis' as const, backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', textStyle: { color: '#383874', fontSize: 12 },
        formatter: (p: any) => {
          if (!p?.length) return '';
          const total = p.reduce((s: number, item: any) => s + (item.value || 0), 0);
          return `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => `${s.marker} ${s.seriesName}: <b>${s.value}所</b>`).join('<br/>')}<hr style="margin:4px 0;border:none;border-top:1px solid #e8ecf4"/>合计不达标: <b>${total}所</b>`;
        } },
      legend: { data: [...stypes], bottom: 0, textStyle: { color: '#383874', fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
      grid: { left: '3%', right: '10%', top: '6%', bottom: '14%', containLabel: true },
      xAxis: { type: 'value' as const, name: '不达标学校数（所）', nameTextStyle: { color: '#9292C1', fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10 }, splitLine: { lineStyle: { color: '#F2F5FA', type: 'dashed' as const } }, max: maxFailVal * 1.4 },
      yAxis: { type: 'category' as const, data: failByType.map(d => d.name), axisLabel: { color: '#383874', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, inverse: true },
      series: stypes.map((st, si) => ({
        name: st, type: 'bar' as const, barWidth: '20%', barGap: '12%',
        itemStyle: { borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: stColors[si] }, { offset: 1, color: stColors[si] + '44' }]) },
        label: { show: true, position: 'right' as const, color: '#383874', fontSize: 9, fontWeight: 'bold' as const, formatter: (p: any) => p.value > 0 ? p.value : '' },
        data: failByType.map(d => d.vals[si]),
      })),
    });
    return () => chart.dispose();
  }, [data]);

  return (
    <TabPageLayout
      stats={(
        <div className="grid-5col">
          <StatCard icon="🛡️" label="安全指标总数" value={safetyInds.length} suffix="项" color="#8676FF" />
          <StatCard icon="💯" label="满分达标指标" value={perfectCount} suffix="项" color="#00B929" />
          <StatCard icon="❌" label="累计不达标" value={totalFails} suffix="次" color="#FF2D2E" />
          <StatCard icon="📊" label="安全均分" value={avgSafety} suffix="%" color="#FFBA69" />
          <StatCard icon="🔍" label={`最需关注: ${worstThree[0]?.name || '-'}`} value={worstThree[0]?.fail || 0} suffix="次不达标" color="#FF708B" />
        </div>
      )}
    >
      <TabSnapSection>
        <div className="tab-snap-section--grid-3">
          <ChartCard title="安全指标得分率排名" insight={getSafetyBarInsight(data)}>
            <div ref={barRef} className="chart-echarts-host" />
          </ChartCard>
          <ChartCard title="三类学校安全雷达" insight={getSafetyRadarInsight(data)}>
            <div ref={radarRef} className="chart-echarts-host" />
          </ChartCard>
          <ChartCard title="三类学校不达标分布" insight={getSafetyBarInsight(data)}>
            <div ref={gridBarRef} className="chart-echarts-host" />
          </ChartCard>
        </div>
      </TabSnapSection>
    </TabPageLayout>
  );
}
