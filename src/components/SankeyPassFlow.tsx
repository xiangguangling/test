import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getSankeyPassFlowInsight } from './ChartInsights';
import {
  applyChartEntranceAnimation,
  mountEcharts,
  observeChartEntranceReplay,
  observeChartResize,
} from '../utils/chartResize';

echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

function buildSankeyOption(data: DashboardData): echarts.EChartsCoreOption {
  const nodes: {
    name: string;
    depth?: number;
    itemStyle?: { color: string };
    label?: { position?: string; distance?: number; fontSize?: number; color?: string };
  }[] = [];
  const links: { source: string; target: string; value: number }[] = [];

  const categories = [
    { name: 'A.学校管理与安全', color: '#4da8ff' },
    { name: 'B.办学硬件与环境', color: '#00d4ff' },
    { name: 'C.师资队伍与发展', color: '#a855f7' },
  ];

  const problemIndicators = data.indicators
    .filter(ind => ind.key !== '得分率' && ind.fail_count > 50)
    .sort((a, b) => b.fail_count - a.fail_count)
    .slice(0, 10);

  const shortNames: Record<string, string> = {
    'B1.1-④公共教学用房得分率': '公共教学用房',
    'B5.1-③生机比得分率': '生机比不达标',
    'C2.3-①得分率': '中高级职称不足',
    'B1.1-③专用教室面积得分率': '专用教室不足',
    'C1.1-①得分率': '教职工数不足',
    'C1.2-①得分率': '生师比不达标',
    'B2.1-②校园生活服务用房得分率': '生活用房不足',
    'C4.1-①得分率': '音体美教师不足',
    'B1.2-②生均用地面积得分率': '用地面积不足',
    'B2.1-①校园办公用房面积得分率': '办公用房不足',
  };

  for (const cat of categories) {
    nodes.push({ name: cat.name, depth: 0, itemStyle: { color: cat.color } });
  }

  for (const ind of problemIndicators) {
    const shortName = shortNames[ind.key] || ind.name;
    nodes.push({
      name: shortName,
      depth: 1,
      itemStyle: { color: ind.avg_rate < 0.7 ? '#ff5c5c' : ind.avg_rate < 0.85 ? '#ff9f43' : '#facc15' },
    });

    const catName = ind.category || '';
    const catNode = categories.find(c => catName.includes(c.name.split('.')[0]));
    if (catNode) {
      links.push({ source: catNode.name, target: shortName, value: ind.fail_count });
    }
  }

  nodes.push({
    name: '不达标学校',
    depth: 2,
    itemStyle: { color: '#ff5c5c' },
    label: { position: 'left', distance: 6, fontSize: 10, color: '#383874' },
  });

  for (const ind of problemIndicators) {
    const shortName = shortNames[ind.key] || ind.name;
    links.push({ source: shortName, target: '不达标学校', value: ind.fail_count });
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: '#FFFFFF',
      borderColor: '#E8ECF4',
      borderWidth: 1,
      textStyle: { color: '#383874', fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as { dataType: string; data: { source: string; target: string; value: number }; name: string; value: number };
        if (p.dataType === 'edge') {
          return `${p.data.source} → ${p.data.target}<br/>数量: <b>${p.data.value}</b> 所学校`;
        }
        return `${p.name}<br/>数值: <b>${p.value}</b>`;
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        nodeAlign: 'left',
        layoutIterations: 0,
        left: '3%',
        right: '6%',
        top: '4%',
        bottom: '4%',
        data: nodes,
        links: links,
        label: { color: '#383874', fontSize: 10, position: 'right' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.25 },
        nodeWidth: 16,
        nodeGap: 12,
      },
    ],
  };
}

function playSankeyCanvasReveal(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove('overview-chart-canvas--sankey-flow');
  void el.offsetWidth;
  el.classList.add('overview-chart-canvas--sankey-flow');
}

export default function SankeyPassFlow({ data }: { data: DashboardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const insight = getSankeyPassFlowInsight(data);

  useEffect(() => {
    const canvas = chartRef.current;
    if (!canvas) return;

    let chart: echarts.ECharts | null = null;
    let disposed = false;
    let rafId = 0;
    let unobserveResize = () => {};
    let unobserveReplay = () => {};

    const option = buildSankeyOption(data);

    const handleResize = () => {
      if (!chart || chart.isDisposed() || !chartRef.current) return;
      if (chartRef.current.clientWidth < 2 || chartRef.current.clientHeight < 2) return;
      chart.resize();
    };

    const init = () => {
      if (disposed || !chartRef.current) return;
      const { clientWidth, clientHeight } = chartRef.current;
      if (clientWidth < 2 || clientHeight < 2) {
        rafId = requestAnimationFrame(init);
        return;
      }

      chart = mountEcharts(chartRef.current, option, undefined, {
        skipEntranceReplay: true,
        skipRevealWait: true,
      });
      unobserveResize = observeChartResize(chartRef.current, handleResize);
      chart.resize();
      playSankeyCanvasReveal(chartRef.current);

      if (cardRef.current) {
        unobserveReplay = observeChartEntranceReplay(cardRef.current, () => {
          if (!chart || chart.isDisposed() || !chartRef.current) return;
          applyChartEntranceAnimation(chart, option, { host: chartRef.current });
          playSankeyCanvasReveal(chartRef.current);
        });
      }

      window.addEventListener('resize', handleResize);
    };

    init();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      unobserveResize();
      unobserveReplay();
      window.removeEventListener('resize', handleResize);
      chart?.dispose();
    };
  }, [data]);

  return (
    <FlipCard
      front={
        <div ref={cardRef} className="card-border glow-orange relative overview-chart-card overview-chart-card--sankey h-full">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <div className="chart-card-title">短板向不达标学校传导</div>
            </div>
          </div>
          <div className="overview-chart-body chart-card-body">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
