import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';
import gsap from 'gsap';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getRegionalGridInsight } from './ChartInsights';
import { useEcharts } from '../hooks/useEcharts';
import { buildSideLegend, buildSideLegendGrid } from '../utils/chartLegend';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const SN: Record<string, string> = {
  'B1.1-④公共教学用房得分率': '公共教学用房', 'B5.1-③生机比得分率': '生机比',
  'C2.3-①得分率': '中高级职称', 'B1.1-③专用教室面积得分率': '专用教室面积',
  'C1.1-①得分率': '教职工数', 'C1.2-①得分率': '生师比',
  'B2.1-②校园生活服务用房得分率': '生活用房', 'C4.1-①得分率': '音体美教师',
  'B1.2-②生均用地面积得分率': '用地面积', 'B2.1-①校园办公用房面积得分率': '办公用房',
  'B5.1-②师机比得分率': '师机比', 'B7.1-①生均绿地面积得分率': '绿地面积',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积', 'B3.1-①生均图书册数得分率': '图书册数',
};

function Cell({ t, i, c, p, appearClass, children }: { t: string; i: string; c: string; p?: string; appearClass?: string; children: React.ReactNode }) {
  return (
    <div className={`card-border chart-panel p-3 flex flex-col relative h-full${appearClass ? ` ${appearClass}` : ""}`} style={{ minHeight: 0 }}>
      <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
      <h3 className="text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-center gap-1.5 flex-shrink-0 pr-6">
        <span style={{ color: c }}>{i}</span><span className="text-center">{t}</span>
      </h3>
      <div className="flex-1 relative" style={{ minHeight: 0 }}>{children}</div>
      {p && <p className="text-[10px] text-text-muted text-center mt-1 flex-shrink-0">{p}</p>}
    </div>
  );
}

export default function RegionalGrid({ data }: { data: DashboardData }) {
  const r1 = useRef<HTMLDivElement>(null), r2 = useRef<HTMLDivElement>(null);
  const ct = useRef<HTMLDivElement>(null);
  useEffect(() => { gsap.fromTo(ct.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }); }, []);

  const areas = ['城市', '县镇', '农村'];
  const colors = ['#FFBA69', '#66C8FF', '#00B929'];
  const colorsLight = ['#FFBA69', '#66C8FF', '#00B929'];
  const keys = ['B1.1-④公共教学用房得分率', 'B5.1-③生机比得分率', 'C2.3-①得分率', 'B1.1-③专用教室面积得分率', 'C1.1-①得分率', 'C1.2-①得分率', 'B2.1-②校园生活服务用房得分率', 'C4.1-①得分率'];

  const failCounts = keys.map(k => { const ind = data.indicators.find(i => i.key === k); return ind?.fail_count ?? 0; });
  useEcharts(r1, {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 } },
    legend: buildSideLegend([...areas, '不达标数']),
    animation: true, animationDuration: 1500, animationEasing: 'cubicOut',
    grid: buildSideLegendGrid(),
    xAxis: { type: 'category', data: keys.map(k => SN[k] || k), axisLabel: { color: '#9292C1', fontSize: 8, interval: 0 }, axisTick: { show: false } },
    yAxis: [
      { type: 'value', max: 1, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } },
      { type: 'value', name: '所', nameGap: 8, nameTextStyle: { color: '#9292C1', fontSize: 9, padding: [0, 0, 0, 0] }, axisLabel: { color: '#9292C1', fontSize: 9, margin: 4 }, splitLine: { show: false } },
    ],
    series: [
      ...areas.map((a, i) => ({ name: a, type: 'bar', barWidth: '28%', barGap: '8%', itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[i] }, { offset: 1, color: colorsLight[i] }]) }, data: keys.map(k => +(data.urban_rural_analysis[a]?.[k] ?? 0).toFixed(3)) })),
      { name: '不达标数', type: 'line', yAxisIndex: 1, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#FF2D2E', width: 2, type: 'dashed' }, itemStyle: { color: '#FF2D2E' }, data: failCounts },
    ],
  });

  const allBubbleKeys = Object.keys(SN);
  const scatter3D_Data = allBubbleKeys.map(k => {
    const cityRate = +(data.urban_rural_analysis['城市']?.[k] ?? 0).toFixed(3);
    const ruralRate = +(data.urban_rural_analysis['农村']?.[k] ?? 0).toFixed(3);
    const ind = data.indicators.find(i => i.key === k);
    const fc = ind?.fail_count ?? 0;
    return { name: SN[k] || k, value: [cityRate, ruralRate, fc, fc], cityRate, ruralRate, failCount: fc };
  }).filter(d => d.cityRate > 0 || d.ruralRate > 0);
  const s3max = Math.max(...scatter3D_Data.map(d => d.failCount), 1);
  useEcharts(r2, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1500, animationEasing: 'cubicOut',
    tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 }, formatter: (p: unknown) => { const pa = p as { name: string; data: { cityRate: number; ruralRate: number; failCount: number } }; if (!pa?.data) return ''; return `<b>${pa.name}</b><br/>城市: ${(pa.data.cityRate * 100).toFixed(1)}%<br/>农村: ${(pa.data.ruralRate * 100).toFixed(1)}%<br/>不达标: <b>${pa.data.failCount}</b> 所`; } },
    visualMap: [{
      top: 6, calculable: true, dimension: 3, min: 1, max: s3max,
      inRange: { color: ['#00B929', '#FFBA69', '#FFBA69', '#FF2D2E'] },
      textStyle: { color: '#9292C1', fontSize: 9 },
      itemWidth: 12, itemHeight: 80,
    }],
    grid3D: {
      boxWidth: 100, boxHeight: 100, boxDepth: 100,
      axisLine: { lineStyle: { color: '#DBDFF1' } },
      axisPointer: { lineStyle: { color: '#ffbd67' } },
      viewControl: { autoRotate: true, autoRotateSpeed: 4, distance: 160, alpha: 0, beta: 0 },
    },
    xAxis3D: { name: '城市\n得分率', nameTextStyle: { color: '#FFBA69', fontSize: 10 }, type: 'value', min: 0.2, max: 1.05, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' } },
    yAxis3D: { name: '农村\n得分率', nameTextStyle: { color: '#00B929', fontSize: 10 }, type: 'value', min: 0.2, max: 1.05, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' } },
    zAxis3D: { name: '不达标\n学校数', nameTextStyle: { color: '#FF2D2E', fontSize: 10 }, type: 'value', axisLabel: { color: '#9292C1', fontSize: 9 } },
    series: [{
      type: 'scatter3D',
      dimensions: ['城市得分率', '农村得分率', '不达标学校数', '不达标学校数'],
      data: scatter3D_Data.map(d => ({ name: d.name, value: d.value, cityRate: d.cityRate, ruralRate: d.ruralRate, failCount: d.failCount })),
      symbolSize: 8,
      itemStyle: { borderWidth: 1, borderColor: '#DBDFF1' },
      label: { show: true, position: 'top', color: '#383874', fontSize: 9, distance: 4, formatter: (p: unknown) => { const d = p as { name: string }; return d.name; } },
      emphasis: { itemStyle: { color: '#8676FF' }, label: { fontSize: 12, fontWeight: 'bold' } },
    }],
  });

  const cells = [
    { r: r2, t: '城乡指标三维对比', i: '🫧', c: '#66C8FF', delay: 'chart-appear-delay-1', insightIndex: 0 },
    { r: r1, t: '城乡关键指标 · 双轴综合对比', i: '📊', c: '#66C8FF', delay: 'chart-appear-delay-2', insightIndex: 1 },
  ];

  return (
    <div ref={ct}>
      <div className="grid grid-cols-2 grid-chart-grid grid-chart-grid--fit">
        {cells.map((item, i) => {
          const cellInsight = getRegionalGridInsight(data, item.insightIndex);
          return (
            <FlipCard
              key={i}
              front={
                <Cell t={item.t} i={item.i} c={item.c} appearClass={`chart-appear ${item.delay}`}>
                  <div ref={item.r} className="chart-embed-canvas" />
                </Cell>
              }
              back={<InsightBack insight={cellInsight} />}
            />
          );
        })}
      </div>
    </div>
  );
}
