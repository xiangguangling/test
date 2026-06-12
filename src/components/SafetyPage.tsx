import { useEffect, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import SafetyGrid from './SafetyGrid';
import TabPageLayout, { TabSnapSection } from './TabPageLayout';
import { getSafetyBarInsight } from './ChartInsights';

export default function SafetyPage({ data }: { data: DashboardData }) {
  const barRef = useRef<HTMLDivElement>(null);

  const safetyInds = data.indicators.filter(i => i.category === 'A类-学校管理与安全' && i.key !== '得分率').sort((a, b) => a.avg_rate - b.avg_rate);
  const totalFails = safetyInds.reduce((s, i) => s + i.fail_count, 0);

  useEffect(() => {
    if (!barRef.current) return;
    const chart = mountEcharts(barRef.current, { tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '4%', top: '12%', bottom: '3%', containLabel: true }, xAxis: { type: 'category', data: safetyInds.map(i => i.name.length > 8 ? i.name.slice(0, 8) + '…' : i.name), axisLabel: { color: '#9292C1', fontSize: 10, rotate: 25 } }, yAxis: { type: 'value', max: 100, name: '得分率(%)', nameTextStyle: { fontSize: 10 }, axisLabel: { color: '#9292C1', fontSize: 10 }, splitLine: { lineStyle: { color: '#F2F5FA' } } }, series: [{ type: 'bar', data: safetyInds.map(i => ({ value: +(i.avg_rate * 100).toFixed(1), itemStyle: { borderRadius: [6, 6, 0, 0], color: i.avg_rate < 0.9 ? '#FFBA69' : '#8676FF' } })), barWidth: '45%', label: { show: true, position: 'top', fontSize: 11, color: '#383874', formatter: '{c}%' } }] });
    return () => chart.dispose();
  }, [data, safetyInds]);

  const worstS = safetyInds[0]; const bestS = safetyInds[safetyInds.length - 1];

  return (
    <TabPageLayout
      stats={(
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <StatCard icon="🛡️" label="安全指标数" value={safetyInds.length} suffix="项" color="#8676FF" />
          <StatCard icon="❌" label="累计不达标" value={totalFails} suffix="次" color="#FF2D2E" />
          <StatCard icon="⚠️" label={`最弱: ${worstS?.name.slice(0, 7) || '-'}`} value={(worstS?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#FFBA69" />
          <StatCard icon="✅" label={`最优: ${bestS?.name.slice(0, 7) || '-'}`} value={(bestS?.avg_rate * 100).toFixed(1) || '-'} suffix="%" color="#00B929" />
        </div>
      )}
    >
      <TabSnapSection>
        <ChartCard title="A类安全指标得分" insight={getSafetyBarInsight(data)}>
          <div ref={barRef} className="chart-echarts-host" />
        </ChartCard>
      </TabSnapSection>

      <TabSnapSection>
        <SafetyGrid data={data} />
      </TabSnapSection>
    </TabPageLayout>
  );
}
