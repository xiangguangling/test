import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import gsap from 'gsap';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getSafetyGridInsight } from './ChartInsights';
import { useEcharts } from '../hooks/useEcharts';
import { buildSideLegend, buildSideLegendGrid } from '../utils/chartLegend';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const catAIndicators = [
  { key: 'A1.1得分率', name: '班级数与班额数', group: 'A1.教学规模' },
  { key: 'A1.2得分率', name: '学生总数', group: 'A1.教学规模' },
  { key: 'A2.1得分率', name: '卫生保健室', group: 'A2.校园卫生' },
  { key: 'A2.2.1得分率', name: '食堂等级达标', group: 'A2.校园卫生' },
  { key: 'A2.2.2得分率', name: '小卖部达标', group: 'A2.校园卫生' },
  { key: 'A2.3.1得分率', name: '饮用水卫生', group: 'A2.校园卫生' },
  { key: 'A2.3.2得分率', name: '厕所卫生', group: 'A2.校园卫生' },
  { key: 'A3.1.2得分率', name: '出入口安全', group: 'A3.校园安全' },
  { key: 'A3.1.1得分率', name: '危房情况', group: 'A3.校园安全' },
  { key: 'A3.2.1得分率', name: '保卫人员', group: 'A3.校园安全' },
  { key: 'A3.2.2得分率', name: '宿舍管理员', group: 'A3.校园安全' },
];

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

export default function SafetyGrid({ data }: { data: DashboardData }) {
  const r1 = useRef<HTMLDivElement>(null), r3 = useRef<HTMLDivElement>(null);
  const ct = useRef<HTMLDivElement>(null);
  useEffect(() => { gsap.fromTo(ct.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }); }, []);

  const stypes = ['小学', '初中', '九年制'];
  const scolors = ['#8676FF', '#FF708B', '#66C8FF'];

  const failBars = catAIndicators
    .map(ind => { const f = data.indicators.find(i => i.key === ind.key); return { name: ind.name, group: ind.group, fail: f?.fail_count ?? 0, rate: f ? +(f.avg_rate * 100).toFixed(1) : 100 }; })
    .filter(d => d.fail > 0)
    .sort((a, b) => b.fail - a.fail);
  const maxFail = Math.max(...failBars.map(d => d.fail), 1);
  useEcharts(r1, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1400, animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis', backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 }, formatter: (p: unknown) => { const pa = p as { name: string; value: number; data: { rate: number } }[]; if (!pa?.length) return ''; const d = pa[0]; return `<b>${d.name}</b><br/>不达标: <b>${d.value}</b> 所<br/>得分率: <b>${d.data.rate}%</b>`; } },
    grid: { left: '3%', right: '10%', top: '3%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '不达标学校数（所）', nameTextStyle: { color: '#9292C1', fontSize: 9 }, axisLabel: { color: '#9292C1', fontSize: 9 }, splitLine: { lineStyle: { color: '#F2F5FA' } }, max: maxFail * 1.3 },
    yAxis: { type: 'category', data: failBars.map(d => d.name), axisLabel: { color: '#9292C1', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, inverse: true },
    series: [{
      type: 'bar',
      barWidth: '55%',
      data: failBars.map(d => ({
        value: d.fail,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: d.fail > 50 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#FF2D2E' }, { offset: 1, color: '#FFBA69' }])
            : d.fail > 10 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#FFBA69' }, { offset: 1, color: '#FFBA69' }])
            : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#FFBA69' }, { offset: 1, color: '#00B929' }]),
        },
        rate: d.rate,
      })),
      label: { show: true, position: 'right', color: '#383874', fontSize: 11, fontWeight: 'bold', formatter: (p: { value: number }) => p.value + '所' },
    }],
  });

  const coreKeys = ['A1.1得分率', 'A1.2得分率', 'A2.1得分率', 'A2.2.1得分率', 'A3.1.1得分率', 'A3.2.1得分率'];
  const coreNames = ['班级班额', '学生总数', '卫生保健室', '食堂达标', '危房排查', '保卫人员'];
  const coreData = coreKeys.map((k, idx) => {
    const vals = stypes.map(st => {
      const cr = data.cross_analysis[st]?.[k];
      return cr != null ? +((1 - cr) * 100).toFixed(2) : 0;
    });
    return { name: coreNames[idx], key: k, vals, totalFail: vals.reduce((a, b) => a + b, 0) };
  }).filter(d => d.totalFail > 0.01)
    .sort((a, b) => b.totalFail - a.totalFail);

  const coreMaxPct = Math.max(...coreData.flatMap(d => d.vals), 5);
  useEcharts(r3, {
    backgroundColor: 'transparent',
    animation: true, animationDuration: 1400, animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis', backgroundColor: '#FFFFFF', borderColor: '#E8ECF4', borderWidth: 1, textStyle: { color: '#383874', fontSize: 11 }, formatter: (p: unknown) => { const pa = p as { seriesName: string; value: number; axisValue: string }[]; if (!pa?.length) return ''; return `<b>${pa[0].axisValue}</b><br/>${pa.map(s => `${s.seriesName}: <b>${s.value.toFixed(1)}%</b>`).join('<br/>')}`; } },
    legend: buildSideLegend(stypes),
    grid: buildSideLegendGrid({ top: '6%' }),
    xAxis: { type: 'value', name: '不达标率 (%)', nameTextStyle: { color: '#9292C1', fontSize: 9 }, axisLabel: { color: '#9292C1', fontSize: 9, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#F2F5FA' } }, max: coreMaxPct * 1.3 },
    yAxis: { type: 'category', data: coreData.map(d => d.name), axisLabel: { color: '#383874', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
    series: stypes.map((st, i) => ({
      name: st, type: 'bar', barWidth: '22%', barGap: '10%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: scolors[i] + 'cc' }, { offset: 1, color: scolors[i] + '44' },
        ]),
      },
      label: { show: true, position: 'right', color: '#383874', fontSize: 9, formatter: (p: { value: number }) => p.value > 0.05 ? p.value.toFixed(1) + '%' : '' },
      data: coreData.map(d => d.vals[i]),
    })),
  });

  const cells = [
    { r: r1, t: '不达标指标排名', i: '🔴', c: '#FF2D2E', delay: 'chart-appear-delay-1', insightIndex: 0 },
    { r: r3, t: '核心指标不达标率 · 三类学校对比', i: '🔍', c: '#FFBA69', delay: 'chart-appear-delay-2', insightIndex: 2 },
  ];

  return (
    <div ref={ct}>
      <div className="grid grid-cols-2 grid-chart-grid grid-chart-grid--fit">
        {cells.map((item, i) => {
          const cellInsight = getSafetyGridInsight(data, item.insightIndex);
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
