import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BoxplotChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { buildSchoolTypeHeatmapOption } from '../utils/heatmapVisualMap';
import FacilityGrid from './FacilityGrid';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import { getFacilityBarInsight, getFacilityHeatmapInsight } from './ChartInsights';
import { useEcharts } from '../hooks/useEcharts';
import { buildSideLegendGrid } from '../utils/chartLegend';

echarts.use([BoxplotChart, GridComponent, TooltipComponent, CanvasRenderer]);

export default function FacilityPage({ data }: { data: DashboardData }) {
  const barRef = useRef<HTMLDivElement>(null);
  const heatRef = useRef<HTMLDivElement>(null);

  const facIndsAll = data.indicators.filter(i => i.category === 'B类-办学硬件与环境' && i.key !== '得分率').sort((a, b) => a.avg_rate - b.avg_rate);
  const facInds = facIndsAll.slice(0, 10); // 只展示得分率最低的 10 项
  const totalFails = facIndsAll.reduce((s, i) => s + i.fail_count, 0);

  useEffect(() => {
    if (!barRef.current) return;
    const chart = mountEcharts(barRef.current, { tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '4%', top: '12%', bottom: '16%', containLabel: true }, xAxis: { type: 'category', data: facInds.map(i => i.name), axisLabel: { color: '#9292C1', fontSize: 9, rotate: 0, interval: 0, overflow: 'break' as const, width: 48 } }, yAxis: { type: 'value', max: 100, name: '得分率(%)', nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10 }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: [{ type: 'bar', data: facInds.map(i => ({ value: +(i.avg_rate * 100).toFixed(1), itemStyle: { borderRadius: [4, 4, 0, 0], color: i.avg_rate < 0.6 ? '#FF2D2E' : i.avg_rate < 0.8 ? '#FFBA69' : '#FF708B' } })), barWidth: '40%', label: { show: true, position: 'top', fontSize: 12, color: '#383874', formatter: '{c}%' } }] });
    return () => chart.dispose();
  }, [data, facInds]);

  useEffect(() => {
    if (!heatRef.current) return;
    const chart = mountEcharts(heatRef.current, buildSchoolTypeHeatmapOption(facInds, data.cross_analysis));
    return () => chart.dispose();
  }, [data, facInds]);

  const worstF = facIndsAll[0]; const bestF = facIndsAll[facIndsAll.length - 1];

  /* ── 七维度指标分布 · 箱线图 ── */
  const boxRef = useRef<HTMLDivElement>(null);
  const catBGroups: Record<string, { name: string; keys: string[] }> = {
    'B1.教学用房': { name: '教学用房(6分)', keys: ['B1.1-①得分率', 'B1.1-②普通教室数得分率', 'B1.1-③专用教室面积得分率', 'B1.1-④公共教学用房得分率', 'B1.2-①生均校舍建筑面积得分率', 'B1.2-②生均用地面积得分率'] },
    'B2.办公生活': { name: '办公生活用房(3分)', keys: ['B2.1-①校园办公用房面积得分率', 'B2.1-②校园生活服务用房得分率', 'B2.1-③住宿生床位配备得分率'] },
    'B3.图书': { name: '图书配置(2分)', keys: ['B3.1-①生均图书册数得分率', 'B3.2-①图书资源配备得分率'] },
    'B4.教学仪器': { name: '教学仪器(2分)', keys: ['B4.1-①教学仪器设备配备得分率', 'B4.2-①音体美器材配备情况得分率'] },
    'B5.信息化': { name: '校园信息化(3分)', keys: ['B5.1-①无线网覆盖得分率', 'B5.1-②师机比得分率', 'B5.1-③生机比得分率'] },
    'B6.体育': { name: '体育用地(3分)', keys: ['B6.1-①体育运动场(馆)得分率', 'B6.1-②篮、排球场地得分率', 'B6.1-③跑道长度得分率'] },
    'B7.绿地': { name: '校园绿地(1分)', keys: ['B7.1-①生均绿地面积得分率'] },
  };
  const stypes = ['小学', '初中', '九年制'];
  const subgroups = Object.entries(catBGroups);
  const boxData: number[][] = [];
  const boxNames = subgroups.map(([, g]) => {
    const vals: number[] = [];
    stypes.forEach(st => g.keys.forEach(k => { const v = data.cross_analysis[st]?.[k]; if (v != null && v > 0) vals.push(v); }));
    vals.sort((a, b) => a - b);
    if (vals.length < 2) { boxData.push([0, 0, 0, 0, 0]); return g.name; }
    const q1 = vals[Math.floor(vals.length * 0.25)];
    const q3 = vals[Math.floor(vals.length * 0.75)];
    const med = vals[Math.floor(vals.length * 0.5)];
    boxData.push([vals[0], q1, med, q3, vals[vals.length - 1]]);
    return g.name;
  });
  useEcharts(boxRef, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1200, animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 } },
    grid: buildSideLegendGrid({ left: "8%", top: "4%" }),
    xAxis: { type: 'category', data: boxNames, axisLabel: { color: '#9292C1', fontSize: 10, interval: 0 }, axisTick: { show: false } },
    yAxis: { type: 'value', name: '得分率', nameTextStyle: { color: '#9292C1', fontSize: 9 }, axisLabel: { color: '#9292C1', fontSize: 9, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } },
    series: [{ type: 'boxplot', data: boxData, itemStyle: { color: 'rgba(0,212,255,0.15)', borderColor: '#66C8FF', borderWidth: 2 }, boxWidth: [10, 25] }],
  });

  return (
    <TabPageLayout
      stats={(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard icon="🏗️" label="硬件指标数" value={facInds.length} suffix="项" color="#FF708B" />
          <StatCard icon="❌" label="累计不达标" value={totalFails} suffix="次" color="#FF2D2E" />
          <StatCard icon="⚠️" label={`最弱: ${worstF?.name.slice(0, 7) || '-'}`} value={(worstF?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#FFBA69" />
          <StatCard icon="✅" label={`最优: ${bestF?.name.slice(0, 7) || '-'}`} value={(bestF?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#00B929" />
        </div>
      )}
    >
      <TabSnapSection className="tab-snap-section--grid">
        <ChartCard title="B类硬件指标得分（最低10项）" insight={getFacilityBarInsight(data)}>
          <div ref={barRef} className="chart-echarts-host" />
        </ChartCard>
        <ChartCard title="硬件指标校型差异" insight={getFacilityHeatmapInsight(data)}>
          <div ref={heatRef} className="chart-echarts-host" />
        </ChartCard>
      </TabSnapSection>

      <TabSnapSection>
        <FacilityGrid data={data} />
      </TabSnapSection>

      <TabSnapSection>
        <ChartCard title="七维度指标分布">
          <div ref={boxRef} className="chart-echarts-host" />
        </ChartCard>
      </TabSnapSection>
    </TabPageLayout>
  );
}
