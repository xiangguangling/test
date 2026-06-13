import { useMemo, useEffect, useRef } from 'react';
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

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const A_INDICATORS = [
  { key: 'A1.1得分率', name: '班级与班额' },
  { key: 'A1.2得分率', name: '学生总数' },
  { key: 'A2.1得分率', name: '卫生保健室' },
  { key: 'A2.2.1得分率', name: '食堂达标' },
  { key: 'A2.2.2得分率', name: '小卖部达标' },
  { key: 'A2.3.1得分率', name: '饮用水卫生' },
  { key: 'A2.3.2得分率', name: '厕所卫生' },
  { key: 'A3.1.2得分率', name: '出入口安全' },
  { key: 'A3.1.1得分率', name: '危房排查' },
  { key: 'A3.2.1得分率', name: '保卫人员' },
  { key: 'A3.2.2得分率', name: '宿舍管理员' },
];

function Cell({ t, i, c, children }: { t: string; i: string; c: string; children: React.ReactNode }) {
  return (
    <div className="card-border chart-panel p-3 flex flex-col relative h-full" style={{ minHeight: 0 }}>
      <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
      <h3 className="text-xs font-semibold text-text-primary mb-1.5 flex items-center justify-center gap-1.5 flex-shrink-0 pr-6">
        <span style={{ color: c }}>{i}</span><span className="text-center">{t}</span>
      </h3>
      <div className="flex-1 relative" style={{ minHeight: 0 }}>{children}</div>
    </div>
  );
}

export default function SafetyGrid({ data }: { data: DashboardData }) {
  const r2 = useRef<HTMLDivElement>(null);
  const ct = useRef<HTMLDivElement>(null);

  useEffect(() => { gsap.fromTo(ct.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }); }, []);

  // ===== 三类学校不达标分布 — 分组柱状图 =====
  const stypes = ['小学', '初中', '九年制'] as const;
  const stColors = ['#8676FF', '#FF708B', '#66C8FF'];
  
  // 从 cross_analysis 计算每类学校每项指标的不达标学校数
  const failByType = useMemo(() => {
    // 估算每类学校总数
    const typeCounts: Record<string, number> = {};
    for (const st of stypes) {
      typeCounts[st] = data.by_school_type[st]?.count ?? 1;
    }
    return A_INDICATORS.map(meta => {
      const vals = stypes.map(st => {
        const rate = data.cross_analysis[st]?.[meta.key] ?? 1;
        // 不达标学校数 ≈ 总数 × (1 - 得分率)
        return Math.round(typeCounts[st] * (1 - rate));
      });
      return { name: meta.name, vals, total: vals.reduce((a, b) => a + b, 0) };
    }).filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const maxFailVal = Math.max(...failByType.flatMap(d => d.vals), 1);

  useEcharts(r2, {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1400,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#FFFFFF',
      borderColor: '#E8ECF4',
      textStyle: { color: '#383874', fontSize: 12 },
      formatter: (p: any) => {
        if (!p?.length) return '';
        const total = p.reduce((s: number, item: any) => s + (item.value || 0), 0);
        return `<b>${p[0].axisValue}</b><br/>${p.map((s: any) => 
          `${s.marker} ${s.seriesName}: <b>${s.value}所</b>`
        ).join('<br/>')}<hr style="margin:4px 0;border:none;border-top:1px solid #e8ecf4"/>合计不达标: <b>${total}所</b>`;
      },
    },
    legend: {
      data: [...stypes],
      bottom: 0,
      textStyle: { color: '#383874', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: '3%', right: '10%', top: '6%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'value' as const,
      name: '不达标学校数（所）',
      nameTextStyle: { color: '#9292C1', fontSize: 10 },
      axisLabel: { color: '#9292C1', fontSize: 10 },
      splitLine: { lineStyle: { color: '#F2F5FA', type: 'dashed' as const } },
      max: maxFailVal * 1.4,
    },
    yAxis: {
      type: 'category' as const,
      data: failByType.map(d => d.name),
      axisLabel: { color: '#383874', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      inverse: true,
    },
    series: stypes.map((st, si) => ({
      name: st,
      type: 'bar' as const,
      barWidth: '20%',
      barGap: '12%',
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: stColors[si] },
          { offset: 1, color: stColors[si] + '44' },
        ]),
      },
      label: {
        show: true,
        position: 'right' as const,
        color: '#383874',
        fontSize: 9,
        fontWeight: 'bold' as const,
        formatter: (p: any) => p.value > 0 ? p.value : '',
      },
      emphasis: {
        itemStyle: { color: stColors[si] },
      },
      data: failByType.map(d => d.vals[si]),
    })),
  });

  const cells = [
    { r: r2, t: '三类学校不达标分布', i: '🏫', c: '#8676FF', insightIndex: 2 },
  ];

  return (
    <div ref={ct}>
      <div className="grid grid-cols-3 grid-chart-grid grid-chart-grid--fit">
        {/* 左占位 */}
        <div />
        {cells.map((item, i) => {
          const cellInsight = getSafetyGridInsight(data, item.insightIndex);
          return (
            <FlipCard
              key={i}
              front={
                <Cell t={item.t} i={item.i} c={item.c}>
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
