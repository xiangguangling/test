import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GaugeChart, PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getCrisisAlertInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';
import { buildSideLegend, sideLegendPieLayout } from '../utils/chartLegend';

echarts.use([GaugeChart, PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const crisisIndicators = [
  {
    key: 'B1.1-④公共教学用房得分率',
    title: '公共教学用房',
    subtitle: '图书馆/心理室/体育室/艺术舞蹈室',
    failPct: 52.2,
    avgRate: 0.478,
    color: '#ef4444',
    icon: '🏥',
    detail: '超过一半学校未设置或未达标公共教学用房，是全部44项指标中最严重的短板',
  },
  {
    key: 'B5.1-③生机比得分率',
    title: '生机比',
    subtitle: '学生终端配比 7:1',
    failPct: 34.9,
    avgRate: 0.651,
    color: '#ff6b2b',
    icon: '💻',
    detail: '三分之一学校生机比不达标，信息化终端设备配置严重不足',
  },
];

export default function CrisisAlert({ data }: { data: DashboardData }) {
  const gaugeRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gaugeRef.current || !pieRef.current) return;

    // Semi-circular probability gauge — matching reference design
    const gaugeValue = +(crisisIndicators[0].avgRate * 100).toFixed(1);
    const gaugeColor =
      gaugeValue < 25 ? '#ef4444'
      : gaugeValue < 45 ? '#ff6b2b'
      : gaugeValue < 60 ? '#f59e0b'
      : gaugeValue < 80 ? '#22c55e'
      : '#3b82f6';

    const gaugeChart = mountEcharts(gaugeRef.current, {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          center: ['50%', '75%'],
          radius: '95%',
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [
                [0.25, '#ef4444'],
                [0.50, '#ff6b2b'],
                [0.75, '#f59e0b'],
                [1.00, '#22c55e'],
              ],
            },
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 16,
            offsetCenter: [0, '-60%'],
            itemStyle: { color: 'auto' },
          },
          axisTick: { length: 10, lineStyle: { color: 'auto', width: 2 } },
          splitLine: { length: 18, lineStyle: { color: 'auto', width: 4 } },
          axisLabel: {
            color: '#9292C1', fontSize: 14, distance: -50, rotate: 'tangential',
            formatter: (v: number) => {
              if (v === 87.5) return '优秀';
              if (v === 62.5) return '良好';
              if (v === 37.5) return '一般';
              if (v === 12.5) return '较差';
              return '';
            },
          },
          title: { offsetCenter: [0, '-10%'], color: '#9292C1', fontSize: 16 },
          detail: {
            fontSize: 28, offsetCenter: [0, '-32%'], valueAnimation: true,
            formatter: (v: number) => Math.round(v) + '%',
            color: gaugeColor,
          },
          data: [{ value: gaugeValue, name: '公共教学用房' }],
        },
      ],
    });

    // Pie chart for pass/fail distribution
    const totalSchools = data.overall.total_schools;
    const failSchools = Math.round(totalSchools * crisisIndicators[0].failPct / 100);
    const passSchools = totalSchools - failSchools;

    const pieChart = mountEcharts(pieRef.current, {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: '{b}: {c} 所 ({d}%)',
      },
      legend: buildSideLegend(['达标学校', '不达标学校'], { fontSize: 10 }),
      series: [
        {
          type: 'pie',
          radius: sideLegendPieLayout.radius,
          center: sideLegendPieLayout.center,
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#FFFFFF',
            borderWidth: 3,
          },
          label: {
            show: true,
            position: 'center',
            formatter: `{total|${totalSchools}所}\n{label|监测学校总数}`,
            rich: {
              total: { fontSize: 32, fontWeight: 'bold', color: '#383874' },
              label: { fontSize: 12, color: '#9292C1', padding: [8, 0, 0, 0] },
            },
          },
          emphasis: {
            label: { fontSize: 20, fontWeight: 'bold' },
          },
          data: [
            {
              value: passSchools,
              name: '达标学校',
              itemStyle: { color: '#22c55e' },
            },
            {
              value: failSchools,
              name: '不达标学校',
              itemStyle: { color: '#ef4444' },
            },
          ],
        },
      ],
    });

    const handleResize = () => {
      gaugeChart.resize();
      pieChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gaugeChart.dispose();
      pieChart.dispose();
    };
  }, [data]);

  const insight = getCrisisAlertInsight(data);

  return (
    <FlipCard
      front={
        <div className="card-border glow-red p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚨</span>
            <h3 className="text-sm font-semibold text-accent-red uppercase tracking-wider">
              最大短板
            </h3>
            <span className="text-xs bg-accent-red/20 text-accent-red px-2 py-0.5 rounded-full animate-pulse-glow">
              CRITICAL
            </span>
          </div>

          <div className="overview-chart-body">
          <div className="grid grid-cols-2 gap-3 h-full min-h-[300px]">
            {/* Gauge */}
            <div className="flex flex-col min-h-0">
              <div ref={gaugeRef} className="overview-chart-canvas flex-1" style={{ minHeight: '260px' }} />
            </div>

            {/* Donut + Info */}
            <div className="flex flex-col min-h-0">
              <div ref={pieRef} className="overview-chart-canvas flex-1" style={{ minHeight: '260px' }} />
              <div className="mt-1 space-y-1.5 pr-1 overview-chart-footer">
                {crisisIndicators.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-1">
                        <span className="text-text-secondary truncate">{item.title}</span>
                        <span style={{ color: item.color }} className="font-bold shrink-0">
                          得分率 {(item.avgRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-text-muted gap-1">
                        <span className="truncate">{item.subtitle}</span>
                        <span className="shrink-0">不达标 {item.failPct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
