import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, GaugeChart, TreemapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import gsap from 'gsap';
import type { DashboardData } from '../types';
import { buildSideLegend, buildSideLegendGrid } from '../utils/chartLegend';
import { mountEcharts } from '../utils/chartResize';

echarts.use([BarChart, GaugeChart, TreemapChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const catBSubgroups: Record<string, { name: string; keys: string[]; icon: string }> = {
  'B1.教学用房': {
    name: '教学用房 (6分)',
    icon: '🏫',
    keys: ['B1.1-①得分率', 'B1.1-②普通教室数得分率', 'B1.1-③专用教室面积得分率', 'B1.1-④公共教学用房得分率', 'B1.2-①生均校舍建筑面积得分率', 'B1.2-②生均用地面积得分率'],
  },
  'B2.办公生活用房': {
    name: '办公生活用房 (3分)',
    icon: '🏢',
    keys: ['B2.1-①校园办公用房面积得分率', 'B2.1-②校园生活服务用房得分率', 'B2.1-③住宿生床位配备得分率'],
  },
  'B3.图书配置': {
    name: '图书配置 (2分)',
    icon: '📚',
    keys: ['B3.1-①生均图书册数得分率', 'B3.2-①图书资源配备得分率'],
  },
  'B4.教学仪器': {
    name: '教学仪器 (2分)',
    icon: '🔬',
    keys: ['B4.1-①教学仪器设备配备得分率', 'B4.2-①音体美器材配备情况得分率'],
  },
  'B5.校园信息化': {
    name: '校园信息化 (3分)',
    icon: '💻',
    keys: ['B5.1-①无线网覆盖得分率', 'B5.1-②师机比得分率', 'B5.1-③生机比得分率'],
  },
  'B6.体育用地': {
    name: '体育用地 (3分)',
    icon: '⚽',
    keys: ['B6.1-①体育运动场(馆)得分率', 'B6.1-②篮、排球场地得分率', 'B6.1-③跑道长度得分率'],
  },
  'B7.校园绿地': {
    name: '校园绿地 (1分)',
    icon: '🌳',
    keys: ['B7.1-①生均绿地面积得分率'],
  },
};

const shortNamesB: Record<string, string> = {
  'B1.1-①得分率': '通风采光照明', 'B1.1-②普通教室数得分率': '普通教室数',
  'B1.1-③专用教室面积得分率': '专用教室面积', 'B1.1-④公共教学用房得分率': '公共教学用房',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积', 'B1.2-②生均用地面积得分率': '生均用地',
  'B2.1-①校园办公用房面积得分率': '办公用房', 'B2.1-②校园生活服务用房得分率': '生活用房',
  'B2.1-③住宿生床位配备得分率': '住宿床位',
  'B3.1-①生均图书册数得分率': '图书册数', 'B3.2-①图书资源配备得分率': '图书馆阅览室',
  'B4.1-①教学仪器设备配备得分率': '教学仪器', 'B4.2-①音体美器材配备情况得分率': '音体美器材',
  'B5.1-①无线网覆盖得分率': '无线网覆盖', 'B5.1-②师机比得分率': '师机比',
  'B5.1-③生机比得分率': '生机比',
  'B6.1-①体育运动场(馆)得分率': '体育运动场', 'B6.1-②篮、排球场地得分率': '篮排球场地',
  'B6.1-③跑道长度得分率': '跑道长度',
  'B7.1-①生均绿地面积得分率': '绿地面积',
};

export default function FacilityAnalysis({ data }: { data: DashboardData }) {
  const treemapRef = useRef<HTMLDivElement>(null);
  const subgroupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  // Treemap: Show fail counts by indicator (size = fail count)
  useEffect(() => {
    if (!treemapRef.current) return;

    const treeData = Object.entries(catBSubgroups).map(([key, group]) => {
      const children = group.keys.map(k => {
        const ind = data.indicators.find(i => i.key === k);
        return {
          name: shortNamesB[k] || k,
          value: ind?.fail_count ?? 0,
          rate: ind?.avg_rate ?? 1,
        };
      }).filter(c => c.value > 0);
      return { name: group.name, children };
    });

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(13,21,40,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e8eaed', fontSize: 12 },
        formatter: (p: unknown) => {
          const param = p as { name: string; value: number; data?: { rate?: number } };
          const rate = param.data?.rate;
          return `<b>${param.name}</b><br/>不达标: <b>${param.value}</b> 所` +
            (rate !== undefined ? `<br/>得分率: <b>${(rate * 100).toFixed(1)}%</b>` : '');
        },
      },
      series: [{
        type: 'treemap',
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, color: '#e8eaed', fontSize: 11, fontWeight: 'bold' },
        upperLabel: { show: true, height: 25, color: '#e8eaed', fontSize: 12, fontWeight: 'bold' },
        itemStyle: { borderColor: '#060b14', borderWidth: 2 },
        levels: [
          {
            // Group level
            itemStyle: { borderWidth: 3, gapWidth: 3 },
            upperLabel: { show: true },
          },
          {
            // Item level - color by fail rate
            colorMappingBy: 'value',
            color: ['#22c55e', '#f59e0b', '#ff6b2b', '#ef4444'],
          },
        ],
        data: treeData,
      }],
    };

    const chart = mountEcharts(treemapRef.current, option, 'dark');
    return () => chart.dispose();
  }, [data]);

  // Subgroup bar chart
  useEffect(() => {
    if (!subgroupRef.current) return;

    const schoolTypes = ['小学', '初中', '九年制'];
    const colors = ['#ff6b2b', '#3b82f6', '#22c55e'];
    const colorsLight = ['#ff8c52', '#60a5fa', '#22c55e'];

    const subgroups = Object.entries(catBSubgroups);
    const names = subgroups.map(([, g]) => g.name);

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13,21,40,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e8eaed', fontSize: 11 },
      },
      legend: buildSideLegend(schoolTypes, { fontSize: 11 }),
      grid: buildSideLegendGrid(),
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: '#9aa0b0', fontSize: 9, interval: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        max: 1,
        axisLabel: { color: '#9aa0b0', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      series: schoolTypes.map((st, i) => ({
        name: st,
        type: 'bar',
        barWidth: '28%',
        barGap: '8%',
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[i] }, { offset: 1, color: colorsLight[i] }]) },
        label: {
          show: true,
          position: 'top',
          color: '#e8eaed',
          fontSize: 9,
          formatter: (p: { value: number }) => (p.value * 100).toFixed(0) + '%',
        },
        data: subgroups.map(([, group]) => {
          const vals = group.keys
            .map(k => data.cross_analysis[st]?.[k] ?? 0)
            .filter(v => v > 0);
          return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3) : 0;
        }),
      })),
    };

    const chart = mountEcharts(subgroupRef.current, option, 'dark');
    return () => chart.dispose();
  }, [data]);

  // Compute key stats
  const totalFails = data.indicators
    .filter(i => i.category?.includes('B类'))
    .reduce((sum, i) => sum + i.fail_count, 0);
  const worstTwo = data.indicators
    .filter(i => i.category?.includes('B类'))
    .sort((a, b) => a.avg_rate - b.avg_rate)
    .slice(0, 2);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Alert Banner */}
      <div className="card-border p-5 border-l-4" style={{ borderLeftColor: '#ef4444', background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(255,107,43,0.05))' }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">🚨</span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-accent-red mb-2">硬件设施 —— 全部44项指标中最严重的短板维度</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="bg-bg-card/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent-red">{totalFails}</div>
                <div className="text-xs text-text-muted">不达标总数（20项指标合计）</div>
              </div>
              <div className="bg-bg-card/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent-orange">{(worstTwo[0]?.avg_rate * 100).toFixed(1)}%</div>
                <div className="text-xs text-text-muted">{worstTwo[0]?.name} 得分率</div>
              </div>
              <div className="bg-bg-card/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-accent-orange">{(worstTwo[1]?.avg_rate * 100).toFixed(1)}%</div>
                <div className="text-xs text-text-muted">{worstTwo[1]?.name} 得分率</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Treemap */}
      <div className="card-border glow-orange p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="text-accent-orange">🗺️</span>
          硬件设施不达标分布
        </h3>
        <div ref={treemapRef} style={{ width: '100%', height: '420px' }} />
      </div>

      {/* 7 subgroups comparison */}
      <div className="card-border glow-blue p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="text-accent-blue">📊</span>
          硬件设施七个子维度 · 三类学校对比
        </h3>
        <div ref={subgroupRef} style={{ width: '100%', height: '380px' }} />
      </div>
    </div>
  );
}
