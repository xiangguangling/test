import { useEffect, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { buildSchoolTypeHeatmapOption } from '../utils/heatmapVisualMap';
import FacilityGrid from './FacilityGrid';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import { getFacilityBarInsight, getFacilityHeatmapInsight } from './ChartInsights';

export default function FacilityPage({ data }: { data: DashboardData }) {
  const barRef = useRef<HTMLDivElement>(null);
  const heatRef = useRef<HTMLDivElement>(null);

  const facInds = data.indicators.filter(i => i.category === 'B类-办学硬件与环境' && i.key !== '得分率').sort((a, b) => a.avg_rate - b.avg_rate);
  const totalFails = facInds.reduce((s, i) => s + i.fail_count, 0);

  useEffect(() => {
    if (!barRef.current) return;
    const chart = mountEcharts(barRef.current, { tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '4%', top: '12%', bottom: '3%', containLabel: true }, xAxis: { type: 'category', data: facInds.map(i => i.name.length > 7 ? i.name.slice(0, 7) + '…' : i.name), axisLabel: { color: '#9292C1', fontSize: 10, rotate: 30 } }, yAxis: { type: 'value', max: 100, name: '得分率(%)', nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10 }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: [{ type: 'bar', data: facInds.map(i => ({ value: +(i.avg_rate * 100).toFixed(1), itemStyle: { borderRadius: [4, 4, 0, 0], color: i.avg_rate < 0.6 ? '#FF2D2E' : i.avg_rate < 0.8 ? '#FFBA69' : '#FF708B' } })), barWidth: '50%', label: { show: true, position: 'top', fontSize: 11, color: '#383874', formatter: '{c}%' } }] });
    return () => chart.dispose();
  }, [data, facInds]);

  useEffect(() => {
    if (!heatRef.current) return;
    const chart = mountEcharts(heatRef.current, buildSchoolTypeHeatmapOption(facInds, data.cross_analysis));
    return () => chart.dispose();
  }, [data, facInds]);

  const worstF = facInds[0]; const bestF = facInds[facInds.length - 1];

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
      <TabSnapSection className="tab-snap-section--split">
        <ChartCard title="B类硬件指标得分" insight={getFacilityBarInsight(data)}>
          <div ref={barRef} className="chart-echarts-host" />
        </ChartCard>
        <ChartCard title="硬件指标校型差异" insight={getFacilityHeatmapInsight(data)}>
          <div ref={heatRef} className="chart-echarts-host" />
        </ChartCard>
      </TabSnapSection>

      <TabSnapSection>
        <FacilityGrid data={data} />
      </TabSnapSection>
    </TabPageLayout>
  );
}
