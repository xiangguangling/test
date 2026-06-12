import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { HeatmapChart, BoxplotChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';
import gsap from 'gsap';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getFacilityGridInsight } from './ChartInsights';
import { useEcharts } from '../hooks/useEcharts';
import { buildHeatmapVisualMap, buildHeatmapLabelStyle } from '../utils/heatmapVisualMap';
import { buildSideLegendGrid } from '../utils/chartLegend';

echarts.use([HeatmapChart, BoxplotChart, GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, CanvasRenderer]);

const catBGroups: Record<string, { name: string; keys: string[] }> = {
  'B1.教学用房': { name: '教学用房(6分)', keys: ['B1.1-①得分率', 'B1.1-②普通教室数得分率', 'B1.1-③专用教室面积得分率', 'B1.1-④公共教学用房得分率', 'B1.2-①生均校舍建筑面积得分率', 'B1.2-②生均用地面积得分率'] },
  'B2.办公生活': { name: '办公生活用房(3分)', keys: ['B2.1-①校园办公用房面积得分率', 'B2.1-②校园生活服务用房得分率', 'B2.1-③住宿生床位配备得分率'] },
  'B3.图书': { name: '图书配置(2分)', keys: ['B3.1-①生均图书册数得分率', 'B3.2-①图书资源配备得分率'] },
  'B4.教学仪器': { name: '教学仪器(2分)', keys: ['B4.1-①教学仪器设备配备得分率', 'B4.2-①音体美器材配备情况得分率'] },
  'B5.信息化': { name: '校园信息化(3分)', keys: ['B5.1-①无线网覆盖得分率', 'B5.1-②师机比得分率', 'B5.1-③生机比得分率'] },
  'B6.体育': { name: '体育用地(3分)', keys: ['B6.1-①体育运动场(馆)得分率', 'B6.1-②篮、排球场地得分率', 'B6.1-③跑道长度得分率'] },
  'B7.绿地': { name: '校园绿地(1分)', keys: ['B7.1-①生均绿地面积得分率'] },
};
const shortB: Record<string, string> = {
  'B1.1-①得分率': '通风采光', 'B1.1-②普通教室数得分率': '普通教室', 'B1.1-③专用教室面积得分率': '专用教室', 'B1.1-④公共教学用房得分率': '公共教学用房',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积', 'B1.2-②生均用地面积得分率': '生均用地',
  'B2.1-①校园办公用房面积得分率': '办公用房', 'B2.1-②校园生活服务用房得分率': '生活用房', 'B2.1-③住宿生床位配备得分率': '住宿床位',
  'B3.1-①生均图书册数得分率': '图书册数', 'B3.2-①图书资源配备得分率': '图书馆阅览室',
  'B4.1-①教学仪器设备配备得分率': '教学仪器', 'B4.2-①音体美器材配备情况得分率': '音体美器材',
  'B5.1-①无线网覆盖得分率': '无线网', 'B5.1-②师机比得分率': '师机比', 'B5.1-③生机比得分率': '生机比',
  'B6.1-①体育运动场(馆)得分率': '运动场', 'B6.1-②篮、排球场地得分率': '篮排球', 'B6.1-③跑道长度得分率': '跑道',
  'B7.1-①生均绿地面积得分率': '绿地面积',
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

export default function FacilityGrid({ data }: { data: DashboardData }) {
  const r2 = useRef<HTMLDivElement>(null), r3 = useRef<HTMLDivElement>(null);
  const ct = useRef<HTMLDivElement>(null);
  useEffect(() => { gsap.fromTo(ct.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }); }, []);

  const stypes = ['小学', '初中', '九年制'];
  const subgroups = Object.entries(catBGroups);
  const subNames = subgroups.map(([, g]) => g.name);

  const heatData: [number, number, number][] = [];
  subgroups.forEach(([, g], xi) => {
    stypes.forEach((st, yi) => {
      const vals = g.keys.map(k => data.cross_analysis[st]?.[k] ?? 0).filter(v => v > 0);
      const avg = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length * 100).toFixed(1) : 0;
      heatData.push([xi, yi, avg]);
    });
  });
  useEcharts(r2, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1000,
    tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 }, formatter: (p: unknown) => { const pa = p as { value: [number, number, number] }; return `<b>${subNames[pa.value[0]]} · ${stypes[pa.value[1]]}</b><br/>得分率: <b>${pa.value[2]}%</b>`; } },
    grid: { left: '14%', right: '8%', top: '16%', bottom: '5%' },
    xAxis: { type: 'category', data: subNames, axisLabel: { color: '#9292C1', fontSize: 9, interval: 0 }, axisTick: { show: false }, position: 'top' },
    yAxis: { type: 'category', data: stypes, axisLabel: { color: '#383874', fontSize: 11 }, axisTick: { show: false } },
    visualMap: buildHeatmapVisualMap(heatData, { orient: 'vertical', right: 0, top: 'center' }),
    series: [{ type: 'heatmap', data: heatData, label: buildHeatmapLabelStyle(10), emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,212,255,0.5)' } }, itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' } }],
  });

  const bAllInds = data.indicators.filter(i => i.category?.includes('B类') && i.key !== '得分率' && i.fail_count > 0);
  const bMaxFail = Math.max(...bAllInds.map(i => i.fail_count), 1);
  const b3DData = bAllInds.map(ind => ({ name: shortB[ind.key] || ind.name, value: [+(ind.avg_rate).toFixed(3), ind.fail_count, +(ind.fail_pct).toFixed(1), ind.fail_count], rate: ind.avg_rate, fail: ind.fail_count }));
  useEcharts(r3, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1500, animationEasing: 'cubicOut',
    tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 }, formatter: (p: unknown) => { const pa = p as { name: string; data: { rate: number; fail: number } }; if (!pa?.data) return ''; return `<b>${pa.name}</b><br/>得分率: ${(pa.data.rate * 100).toFixed(1)}%<br/>不达标: <b>${pa.data.fail}</b> 所`; } },
    visualMap: [{
      top: 6, calculable: true, dimension: 3, min: 1, max: bMaxFail,
      inRange: { color: ['#00B929', '#FFBA69', '#FFBA69', '#FF2D2E'] },
      textStyle: { color: '#9292C1', fontSize: 9 },
      itemWidth: 12, itemHeight: 80,
    }],
    grid3D: {
      boxWidth: 100, boxHeight: 100, boxDepth: 100,
      axisLine: { lineStyle: { color: '#DBDFF1' } },
      axisPointer: { lineStyle: { color: '#ffbd67' } },
      viewControl: { autoRotate: true, autoRotateSpeed: 5, distance: 160, alpha: 0, beta: 0 },
    },
    xAxis3D: { name: '得分率', nameTextStyle: { color: '#00B929', fontSize: 10 }, type: 'value', min: 0.3, max: 1.05, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' } },
    yAxis3D: { name: '不达标\n学校数', nameTextStyle: { color: '#FF2D2E', fontSize: 10 }, type: 'value', axisLabel: { color: '#9292C1', fontSize: 9 } },
    zAxis3D: { name: '不达标\n比例(%)', nameTextStyle: { color: '#FFBA69', fontSize: 10 }, type: 'value', axisLabel: { color: '#9292C1', fontSize: 9, formatter: '{value}%' } },
    series: [{
      type: 'scatter3D',
      dimensions: ['得分率', '不达标学校数', '不达标比例', '不达标学校数'],
      data: b3DData.map(d => ({ name: d.name, value: d.value, rate: d.rate, fail: d.fail })),
      symbolSize: 8,
      itemStyle: { borderWidth: 1, borderColor: '#DBDFF1' },
      label: { show: true, position: 'top', color: '#383874', fontSize: 9, distance: 4, formatter: (p: unknown) => { const d = p as { name: string }; return d.name; } },
      emphasis: { itemStyle: { color: '#8676FF' }, label: { fontSize: 12, fontWeight: 'bold' } },
    }],
  });

  const cells = [
    { r: r3, t: '硬件指标三维分析', i: '🫧', c: '#FFBA69', delay: 'chart-appear-delay-1', insightIndex: 0 },
    { r: r2, t: '七维度×三类学校', i: '🔥', c: '#66C8FF', delay: 'chart-appear-delay-2', insightIndex: 1 },
  ];

  return (
    <div ref={ct}>
      <div className="grid grid-cols-2 grid-chart-grid grid-chart-grid--fit">
        {cells.map((item, i) => {
          const cellInsight = getFacilityGridInsight(data, item.insightIndex);
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
