import { useEffect, useMemo, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import FigmaRadarChartPanel from './figma/FigmaRadarChartPanel';
import { buildRegionalRadar } from './figma/figmaRadarData';
import RegionalGrid from './RegionalGrid';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import {
  getRegionalBarInsight,
  getRegionalRadarInsight,
  getRegionalHeatmapInsight,
  getRegionalScatterInsight,
  getRegionalLineInsight,
} from './ChartInsights';

export default function RegionalPage({ data }: { data: DashboardData }) {
  const barRef = useRef<HTMLDivElement>(null);
  const heatRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const areas = ['城市', '县镇', '农村'] as const;
  const areaColors = ['#8676FF', '#66C8FF', '#FFBA69'];
  const areaIcons = ['🏙️', '🏘️', '🌾'];

  useEffect(() => {
    if (!barRef.current) return;
    const keys = ['B1.1-④公共教学用房得分率', 'B5.1-③生机比得分率', 'C2.3-①得分率', 'B1.1-③专用教室面积得分率', 'C1.1-①得分率', 'C1.2-①得分率', 'B2.1-②校园生活服务用房得分率', 'C4.1-①得分率'];
    const short: Record<string, string> = { 'B1.1-④公共教学用房得分率': '公共教学用房', 'B5.1-③生机比得分率': '生机比', 'C2.3-①得分率': '中高级职称', 'B1.1-③专用教室面积得分率': '专用教室', 'C1.1-①得分率': '教职工数', 'C1.2-①得分率': '生师比', 'B2.1-②校园生活服务用房得分率': '生活用房', 'C4.1-①得分率': '音体美教师' };
    const chart = mountEcharts(barRef.current, { tooltip: { trigger: 'axis' }, legend: { data: [...areas], bottom: 0, textStyle: { color: '#9292C1', fontSize: 11 } }, grid: { left: '3%', right: '4%', top: '10%', bottom: '12%', containLabel: true }, xAxis: { type: 'category', data: keys.map(k => short[k] || k), axisLabel: { color: '#9292C1', fontSize: 10, rotate: 15 } }, yAxis: { type: 'value', max: 1, name: '得分率', nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: areas.map((a, i) => ({ name: a, type: 'bar', barWidth: '24%', barGap: '8%', itemStyle: { borderRadius: [4, 4, 0, 0], color: areaColors[i] }, data: keys.map(k => +(data.urban_rural_analysis[a]?.[k] ?? 0).toFixed(3)) })) });
    return () => chart.dispose();
  }, [data]);

  const regionalRadar = useMemo(() => buildRegionalRadar(data), [data]);

  useEffect(() => {
    if (!heatRef.current) return;
    const keys = ['B1.1-④公共教学用房得分率', 'B5.1-③生机比得分率', 'C2.3-①得分率', 'B1.1-③专用教室面积得分率', 'C1.1-①得分率', 'C1.2-①得分率', 'B2.1-②校园生活服务用房得分率', 'C4.1-①得分率'];
    const short: Record<string, string> = { 'B1.1-④公共教学用房得分率': '公共教学', 'B5.1-③生机比得分率': '生机比', 'C2.3-①得分率': '中高级职称', 'B1.1-③专用教室面积得分率': '专用教室', 'C1.1-①得分率': '教职工', 'C1.2-①得分率': '生师比', 'B2.1-②校园生活服务用房得分率': '生活用房', 'C4.1-①得分率': '音体美' };
    const heatData: [number, number, number][] = [];
    keys.forEach((k, xi) => areas.forEach((a, yi) => { heatData.push([xi, yi, +(data.urban_rural_analysis[a]?.[k] ?? 0).toFixed(3)]); }));
    const chart = mountEcharts(heatRef.current, { tooltip: { formatter: (p: any) => `${short[keys[p.value[0]]] || keys[p.value[0]]} · ${areas[p.value[1]]}<br/>得分率: <b>${(p.value[2] * 100).toFixed(1)}%</b>` }, grid: { left: '12%', right: '8%', top: '10%', bottom: '5%' }, xAxis: { type: 'category', data: keys.map(k => short[k] || k), axisLabel: { color: '#9292C1', fontSize: 10, rotate: 15 } }, yAxis: { type: 'category', data: [...areas], axisLabel: { color: '#383874', fontSize: 11 } }, visualMap: { min: 0.4, max: 1, orient: 'vertical', right: 0, top: 'center', inRange: { color: ['#FF708B', '#FFBA69', '#66C8FF', '#8676FF'] }, textStyle: { color: '#9292C1', fontSize: 10 } }, series: [{ type: 'heatmap', data: heatData, label: { show: true, fontSize: 11, color: '#fff', formatter: (p: any) => (p.value[2] * 100).toFixed(0) + '%' }, itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#fff' } }] });
    return () => chart.dispose();
  }, [data]);

  useEffect(() => {
    if (!scatterRef.current) return;
    const allInds = data.indicators.filter(i => i.key !== '得分率').slice(0, 30);
    const pts: [number, number, string, string][] = [];
    areas.forEach((a, ai) => {
      allInds.forEach(ind => {
        const v = data.urban_rural_analysis[a]?.[ind.key];
        if (v != null && v > 0) pts.push([ai + (Math.random() - 0.5) * 0.3, +(v).toFixed(3), a, ind.name]);
      });
    });
    const chart = mountEcharts(scatterRef.current, { tooltip: { trigger: 'item', formatter: (p: any) => `${p.value[2]}<br/>${p.value[3]}<br/>得分率: <b>${(p.value[1] * 100).toFixed(1)}%</b>` }, grid: { left: '8%', right: '4%', top: '10%', bottom: '3%' }, xAxis: { type: 'category', data: [...areas], axisLabel: { color: '#383874', fontSize: 11 }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, yAxis: { type: 'value', max: 1, name: '得分率', nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: areas.map((a, i) => ({ type: 'scatter', name: a, data: pts.filter(p => p[2] === a).map(p => [i, p[1]]), symbolSize: 6, itemStyle: { color: areaColors[i] + '66', borderColor: areaColors[i], borderWidth: 0.5 } })) });
    return () => chart.dispose();
  }, [data]);

  useEffect(() => {
    if (!lineRef.current) return;
    const keys = ['B1.1-④公共教学用房得分率', 'B5.1-③生机比得分率', 'C2.3-①得分率', 'B1.1-③专用教室面积得分率', 'C1.1-①得分率', 'C1.2-①得分率'];
    const short: Record<string, string> = { 'B1.1-④公共教学用房得分率': '公共教学', 'B5.1-③生机比得分率': '生机比', 'C2.3-①得分率': '中高级', 'B1.1-③专用教室面积得分率': '专用教室', 'C1.1-①得分率': '教职工', 'C1.2-①得分率': '生师比' };
    const chart = mountEcharts(lineRef.current, { tooltip: { trigger: 'axis' }, legend: { data: [...areas], bottom: 0, textStyle: { color: '#9292C1', fontSize: 10 } }, grid: { left: '3%', right: '4%', top: '10%', bottom: '12%', containLabel: true }, xAxis: { type: 'category', data: keys.map(k => short[k] || k), axisLabel: { color: '#9292C1', fontSize: 10, rotate: 12 } }, yAxis: { type: 'value', max: 1, nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10, formatter: (v: number) => (v * 100).toFixed(0) + '%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: areas.map((a, i) => ({ name: a, type: 'line', data: keys.map(k => +(data.urban_rural_analysis[a]?.[k] ?? 0).toFixed(3)), smooth: true, symbol: 'circle', symbolSize: 5, lineStyle: { color: areaColors[i], width: 2 }, itemStyle: { color: areaColors[i] } })) });
    return () => chart.dispose();
  }, [data]);

  return (
    <TabPageLayout
      stats={(
        <div className="grid-3col">
          {areas.map((a, i) => (
            <StatCard key={a} icon={areaIcons[i]} label={`${a}学校`} value={data.by_urban_rural[a]?.count || 0} suffix="所" color={areaColors[i]} />
          ))}
        </div>
      )}
    >
      <TabSnapSection>
        <div className="tab-snap-section--split">
          <ChartCard title="城乡关键指标对比" insight={getRegionalBarInsight(data)}>
            <div ref={barRef} className="chart-echarts-host" />
          </ChartCard>
          <FigmaRadarChartPanel
            title="八大指标城乡对比"
            indicators={regionalRadar.indicators}
            series={regionalRadar.series}
            className="chart-card--fill"
            insight={getRegionalRadarInsight(data)}
          />
        </div>
      </TabSnapSection>

      <TabSnapSection>
        <div className="tab-snap-section--grid-3">
          <ChartCard title="八项指标城乡得分" insight={getRegionalHeatmapInsight(data)}>
            <div ref={heatRef} className="chart-echarts-host" />
          </ChartCard>
          <ChartCard title="各区域指标得分分布" insight={getRegionalScatterInsight(data)}>
            <div ref={scatterRef} className="chart-echarts-host" />
          </ChartCard>
          <ChartCard title="核心指标城乡走势" insight={getRegionalLineInsight(data)}>
            <div ref={lineRef} className="chart-echarts-host" />
          </ChartCard>
        </div>
      </TabSnapSection>

      <TabSnapSection>
        <RegionalGrid data={data} />
      </TabSnapSection>
    </TabPageLayout>
  );
}
