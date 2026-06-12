import { useEffect, useRef } from 'react';
import type { DashboardData } from '../types';
import { mountEcharts } from '../utils/chartResize';
import ChartCard from './ChartCard';

interface HexagonMapProps {
  data: DashboardData;
  className?: string;
}

export default function HexagonMap({ data, className = '' }: HexagonMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Generate hex grid data from indicators × regions
    const cols = 20;
    const rows = 12;
    const hexW = 46;
    const hexH = 52;
    const gridData: [number, number, number][] = [];

    // Map all indicators to grid positions with regional variation
    const allInds = data.indicators.filter(i => i.key !== '得分率');
    const areas = ['城市', '县镇', '农村'] as const;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexW + (row % 2 === 0 ? 0 : hexW / 2);
        const y = row * hexH * 0.75;

        // Get value from nearest indicator
        const idx = (row * cols + col) % allInds.length;
        const areaIdx = (row + col) % 3;
        const ind = allInds[idx];
        const area = areas[areaIdx];
        const val = data.urban_rural_analysis[area]?.[ind.key] ?? ind.avg_rate;

        gridData.push([x, y, +(val * 100).toFixed(1)]);
      }
    }

    // Normalize for color mapping
    const values = gridData.map(d => d[2]);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);

    // Figma hexagon color stops: blue(90+) → light-purple(70-90) → pink(50-70) → red(<50)
    const colorStops = [
      { max: 45, color: '#F65678' },
      { max: 60, color: '#E788D5' },
      { max: 75, color: '#F6CDEB' },
      { max: 85, color: '#C0CEFF' },
      { max: 100, color: '#023AFF' },
    ];

    function getColor(v: number): string {
      for (const stop of colorStops) {
        if (v <= stop.max) return stop.color;
      }
      return '#023AFF';
    }

    // Value scale labels (0, 25, 50, 75, 100, 125, 150, 175) but ours is 0-100
    const scaleLabels = [0, 20, 40, 60, 80, 100];

    const chart = mountEcharts(chartRef.current, {
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#DBDFF1',
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: (p: any) => {
          const v = p.value[2];
          const ind = allInds[Math.floor(p.value[0] + p.value[1]) % allInds.length];
          return `<b>${ind?.name || '指标'}</b><br/>得分率: <b>${v}%</b>`;
        },
      },
      grid: {
        left: 30, right: 80, top: 40, bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: 'value',
        show: false,
        min: -20,
        max: cols * hexW + 20,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: -20,
        max: rows * hexH * 0.75 + 20,
      },
      series: [{
        type: 'scatter',
        data: gridData.map(d => ({
          value: d,
          itemStyle: {
            color: getColor(d[2]),
            borderColor: 'rgba(255,255,255,0.3)',
            borderWidth: 1.5,
          },
        })),
        symbolSize: 24,
        symbol: 'path://M 0,-12 L 10.4,-6 L 10.4,6 L 0,12 L -10.4,6 L -10.4,-6 Z',
        label: { show: false },
        emphasis: {
          scale: 1.8,
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.3)' },
          label: {
            show: true,
            formatter: (p: any) => Math.round(p.value[2]) + '%',
            fontSize: 10,
            color: '#383874',
            position: 'top',
          },
        },
      }],
      // Value scale (visualMap-like but custom positioned)
      graphic: [
        // Scale title
        {
          type: 'text',
          left: 'right',
          top: 30,
          style: { text: '得分率', fill: '#B8B9C1', font: '11px Roboto' },
        },
        // Scale bar background
        {
          type: 'rect',
          right: 16, top: 55,
          shape: { width: 12, height: 160 },
          style: { fill: '#F6F7FB', stroke: '#DBDFF1', lineWidth: 1 },
        },
        // Scale labels
        ...scaleLabels.map((l, i) => ({
          type: 'text' as const,
          right: 36, top: 55 + i * 32,
          style: { text: String(l), fill: '#B8B9C1', font: '10px Roboto', textAlign: 'right' as const },
        })),
        // Color gradient on scale
        ...scaleLabels.map((l, i) => ({
          type: 'rect' as const,
          right: 16, top: 160 - i * 32 + 55,
          shape: { width: 12, height: 32 },
          style: { fill: getColor(l) },
        })),
      ],
    });
    return () => chart.dispose();
  }, [data]);

  return (
    <ChartCard
      title="城乡指标六边形分布"
      className={className}
      action={
        <div className="flex items-center gap-1">
          <button className="period-btn">ALL</button>
          <button className="period-btn">3M</button>
          <button className="period-btn active">当前</button>
        </div>
      }
    >
      <div ref={chartRef} style={{ width: '100%', height: 480 }} />
    </ChartCard>
  );
}
