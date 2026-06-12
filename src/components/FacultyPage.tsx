import { useEffect, useMemo, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import FigmaRadarChartPanel from './figma/FigmaRadarChartPanel';
import { buildFacultyRadar } from './figma/figmaRadarData';
import { buildSchoolTypeHeatmapOption } from '../utils/heatmapVisualMap';
import FacultyGrid from './FacultyGrid';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import { getFacultyHeatmapInsight, getFacultyLollipopInsight, getFacultyRadarInsight } from './ChartInsights';

export default function FacultyPage({ data }: { data: DashboardData }) {
  const heatRef = useRef<HTMLDivElement>(null);
  const lollipopRef = useRef<HTMLDivElement>(null);

  const facInds = useMemo(
    () => data.indicators
      .filter(i => i.category === 'C类-师资队伍与发展' && i.key !== '得分率')
      .sort((a, b) => a.avg_rate - b.avg_rate),
    [data],
  );
  const totalFails = facInds.reduce((s, i) => s + i.fail_count, 0);

  const facultyRadar = useMemo(() => buildFacultyRadar(data), [data]);

  useEffect(() => {
    if (!heatRef.current) return;
    const chart = mountEcharts(heatRef.current, buildSchoolTypeHeatmapOption(facInds, data.cross_analysis));
    return () => chart.dispose();
  }, [data, facInds]);

  useEffect(() => {
    if (!lollipopRef.current) return;
    const sorted = [...facInds].sort((a, b) => b.avg_rate - a.avg_rate);
    const chart = mountEcharts(lollipopRef.current, { tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '8%', top: '10%', bottom: '3%', containLabel: true }, xAxis: { type: 'value', min: 60, max: 105, axisLabel: { color: '#9292C1', fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, yAxis: { type: 'category', data: sorted.map(i => i.name.length > 8 ? i.name.slice(0, 8) + '…' : i.name).reverse(), axisLabel: { color: '#9292C1', fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false }, inverse: true }, series: [{ type: 'bar', barWidth: 2, data: sorted.reverse().map(d => ({ value: +(d.avg_rate * 100).toFixed(1), itemStyle: { color: '#DBDFF1' } })), z: 0 }, { type: 'scatter', symbolSize: 14, data: sorted.map(d => ({ value: +(d.avg_rate * 100).toFixed(1), itemStyle: { color: d.avg_rate >= 0.9 ? '#66C8FF' : d.avg_rate >= 0.75 ? '#FFBA69' : '#FF2D2E', borderColor: '#fff', borderWidth: 2 } })), label: { show: true, position: 'right', color: '#383874', fontSize: 11, fontWeight: 'bold', formatter: '{c}%' }, z: 10 }] });
    return () => chart.dispose();
  }, [data, facInds]);

  const worstF = facInds[0]; const bestF = facInds[facInds.length - 1];

  return (
    <TabPageLayout
      stats={(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard icon="👩‍🏫" label="师资指标数" value={facInds.length} suffix="项" color="#66C8FF" />
          <StatCard icon="❌" label="累计不达标" value={totalFails} suffix="次" color="#FF2D2E" />
          <StatCard icon="⚠️" label={`最弱: ${worstF?.name.slice(0, 7) || '-'}`} value={(worstF?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#FFBA69" />
          <StatCard icon="✅" label={`最优: ${bestF?.name.slice(0, 7) || '-'}`} value={(bestF?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#00B929" />
        </div>
      )}
    >
      <TabSnapSection className="tab-snap-section--split">
        <ChartCard title="师资指标校型差异" insight={getFacultyHeatmapInsight(data)}>
          <div ref={heatRef} className="chart-echarts-host" />
        </ChartCard>
        <ChartCard title="师资指标得分排序" insight={getFacultyLollipopInsight(data)}>
          <div ref={lollipopRef} className="chart-echarts-host" />
        </ChartCard>
      </TabSnapSection>

      <TabSnapSection>
        <FigmaRadarChartPanel
          title="三类学校师资对比"
          indicators={facultyRadar.indicators}
          series={facultyRadar.series}
          className="chart-card--radar-panel"
          insight={getFacultyRadarInsight(data)}
        />
      </TabSnapSection>

      <TabSnapSection>
        <FacultyGrid data={data} />
      </TabSnapSection>
    </TabPageLayout>
  );
}
