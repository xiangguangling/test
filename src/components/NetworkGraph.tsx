import { useEffect, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import ChartCard from './ChartCard';
import FigmaScaledCanvas from './figma/FigmaScaledCanvas';
import { FIGMA } from './figma/figmaTheme';

const W = 959;
const H = 585;

export default function NetworkGraph({ data, className = '' }: { data: DashboardData; className?: string }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const cx = W / 2;
    const cy = H / 2 - 20;
    const r = 200;

    const cats = [
      { cat: 'A类-学校管理与安全', color: FIGMA.purple },
      { cat: 'B类-办学硬件与环境', color: FIGMA.pink },
      { cat: 'C类-师资队伍与发展', color: FIGMA.cyan },
    ];

    const nodes: { name: string; x: number; y: number; symbolSize: number; itemStyle: object; label?: object }[] = [];
    const edges: { source: number; target: number; lineStyle: object }[] = [];

    const overallRate = +(data.overall.avg_rate * 100).toFixed(1);
    nodes.push({
      name: `综合\n${overallRate}%`,
      x: cx, y: cy,
      symbolSize: 80,
      itemStyle: { color: FIGMA.purple, shadowBlur: 20, shadowColor: FIGMA.purple + '40' },
      label: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
    });

    let idx = 1;
    const picks = cats.flatMap(cat =>
      data.indicators
        .filter(i => i.category === cat.cat && i.key !== '得分率')
        .sort((a, b) => b.avg_rate - a.avg_rate)
        .slice(0, 3)
        .map(ind => ({ ...ind, color: cat.color }))
    );

    picks.forEach((ind, pi) => {
      const angle = (pi / picks.length) * Math.PI * 2 - Math.PI / 2;
      const nx = cx + Math.cos(angle) * r;
      const ny = cy + Math.sin(angle) * r;
      const pct = +(ind.avg_rate * 100).toFixed(0);
      nodes.push({
        name: `${ind.name.slice(0, 5)}\n${pct}%`,
        x: nx, y: ny,
        symbolSize: 44 + (1 - ind.avg_rate) * 30,
        itemStyle: {
          color: pct >= 90 ? FIGMA.green : pct >= 75 ? ind.color : FIGMA.orange,
          borderColor: '#fff', borderWidth: 3,
        },
        label: { fontSize: 9, color: FIGMA.textPrimary, position: 'bottom' as const, distance: 4 },
      });
      edges.push({
        source: 0, target: idx,
        lineStyle: { color: ind.color, width: 2, opacity: 0.35, curveness: 0.2 },
      });
      idx++;
    });

    for (let i = 1; i < nodes.length - 1; i += 2) {
      edges.push({
        source: i, target: i + 1,
        lineStyle: { color: '#DBDFF1', width: 1, opacity: 0.25, curveness: 0.3 },
      });
    }

    const chart = mountEcharts(chartRef.current, {
      series: [{
        type: 'graph',
        layout: 'none',
        roam: false,
        data: nodes,
        edges,
        label: { show: true },
        lineStyle: { opacity: 0.4 },
        emphasis: { focus: 'adjacency' },
      }],
      tooltip: { formatter: (p: { name: string }) => p.name.replace('\n', ' ') },
    });
    return () => chart.dispose();
  }, [data]);

  return (
    <ChartCard
      title="指标关联网络"
      className={className}
    >
      <FigmaScaledCanvas designWidth={W} designHeight={H}>
        <div ref={chartRef} style={{ width: W, height: H, background: FIGMA.bgCard, borderRadius: 12 }} />
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
