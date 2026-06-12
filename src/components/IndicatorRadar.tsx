import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getIndicatorRadarInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';
import { buildSideLegend, buildBottomLegend, sideLegendRadarCenter, sideLegendRadarRadius, bottomLegendRadarCenter, bottomLegendRadarRadius } from '../utils/chartLegend';

echarts.use([RadarChart, RadarComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const categoryMeta: Record<string, { name: string; color: string }> = {
  'A类-学校管理与安全': { name: 'A. 学校管理与安全', color: '#3b82f6' },
  'B类-办学硬件与环境': { name: 'B. 办学硬件与环境', color: '#ff6b2b' },
  'C类-师资队伍与发展': { name: 'C. 师资队伍与发展', color: '#8b5cf6' },
};

const shortNames: Record<string, string> = {
  'A1.1得分率': '班级班额', 'A1.2得分率': '学生总数', 'A2.1得分率': '卫生保健室',
  'A2.2.1得分率': '食堂达标', 'A2.2.2得分率': '小卖部达标', 'A2.3.1得分率': '饮用水',
  'A2.3.2得分率': '卫生厕所', 'A3.1.2得分率': '出入口安全', 'A3.1.1得分率': '危房情况',
  'A3.2.1得分率': '保卫人员', 'A3.2.2得分率': '宿舍管理员',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积', 'B1.2-②生均用地面积得分率': '用地面积',
  'B2.1-①校园办公用房面积得分率': '办公用房', 'B2.1-②校园生活服务用房得分率': '生活用房',
  'B2.1-③住宿生床位配备得分率': '住宿床位', 'B3.1-①生均图书册数得分率': '图书册数',
  'B3.2-①图书资源配备得分率': '图书资源', 'B4.1-①教学仪器设备配备得分率': '教学仪器',
  'B4.2-①音体美器材配备情况得分率': '音体美器材', 'B5.1-①无线网覆盖得分率': '无线网',
  'B5.1-②师机比得分率': '师机比', 'B5.1-③生机比得分率': '生机比',
  'B6.1-①体育运动场(馆)得分率': '运动场', 'B6.1-②篮、排球场地得分率': '篮排球',
  'B6.1-③跑道长度得分率': '跑道', 'B7.1-①生均绿地面积得分率': '绿地面积',
  'B1.1-②普通教室数得分率': '普通教室', 'B1.1-①得分率': '通风采光',
  'B1.1-③专用教室面积得分率': '专用教室', 'B1.1-④公共教学用房得分率': '公共教学用房',
  'C1.1-①得分率': '教职工数', 'C1.3-①得分率': '骨干教师', 'C2.1-①得分率': '教师资格证',
  'C3.1-①得分率': '培训时间', 'C3.2-①得分率': '培训经费', 'C4.1-①得分率': '音体美教师',
  'C5.1-①得分率': '心理教师', 'C5.2-①得分率': '校医保健', 'C6.1-①得分率': '体育活动',
  'C6.2-①得分率': '体质健康', 'C2.3-①得分率': '中高级职称', 'C2.2-①得分率': '教师学历',
  'C1.2-①得分率': '生师比',
};

export default function IndicatorRadar({
  data,
  inline = false,
}: {
  data: DashboardData;
  inline?: boolean;
}) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
        // Group indicators by category and compute averages
    const categories = Object.keys(categoryMeta);
    const indicatorMap: Record<string, { name: string; max: number }> = {};
    const seriesData: Record<string, { value: number[]; name: string }> = {};

    // Compute radar indicators for each sub-indicator within categories
    // We'll pick top 8 most interesting indicators across all categories
    const allIndicators = [...data.indicators]
      .filter(ind => ind.key !== '得分率')
      .sort((a, b) => a.avg_rate - b.avg_rate);

    // Use specific interesting indicators for the radar
    const selectedKeys = [
      'B1.1-④公共教学用房得分率', 'B5.1-③生机比得分率', 'C2.3-①得分率',
      'B1.1-③专用教室面积得分率', 'C1.1-①得分率', 'C1.2-①得分率',
      'B2.1-②校园生活服务用房得分率', 'C4.1-①得分率', 'B1.2-②生均用地面积得分率',
      'B2.1-①校园办公用房面积得分率', 'B5.1-②师机比得分率', 'C2.1-①得分率',
      'B7.1-①生均绿地面积得分率', 'C2.2-①得分率', 'B1.2-①生均校舍建筑面积得分率',
      'C1.3-①得分率',
    ];

    const indicator_data: { name: string; max: number }[] = [];
    const schoolTypeValues: Record<string, number[]> = {
      '小学': [],
      '初中': [],
      '九年制': [],
    };

    for (const key of selectedKeys) {
      const ind = data.indicators.find(i => i.key === key);
      if (ind) {
        const shortName = shortNames[key] || ind.name;
        indicator_data.push({ name: shortName, max: 1 });
        for (const st of ['小学', '初中', '九年制']) {
          const val = data.cross_analysis[st]?.[key] ?? 0;
          schoolTypeValues[st].push(Number(val.toFixed(3)));
        }
      }
    }

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 12 },
      },
      legend: inline
        ? buildBottomLegend(['小学', '初中', '九年制'], { fontSize: 10, bottom: 2, itemGap: 14 })
        : buildSideLegend(['小学', '初中', '九年制'], { fontSize: 11 }),
      radar: {
        center: inline ? bottomLegendRadarCenter : sideLegendRadarCenter,
        radius: inline ? bottomLegendRadarRadius : sideLegendRadarRadius,
        indicator: indicator_data,
        axisName: {
          color: '#9292C1',
          fontSize: inline ? 8 : 9,
          borderRadius: 3,
          padding: [2, 3],
        },
        axisNameGap: inline ? 4 : 8,
        axisLine: { lineStyle: { color: '#DBDFF1' } },
        splitLine: { lineStyle: { color: '#F2F5FA' } },
        splitArea: {
          areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.02)'] },
        },
      },
      series: [
        {
          type: 'radar',
          name: '小学',
          data: [{ value: schoolTypeValues['小学'], name: '小学' }],
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#ff6b2b', width: 2 },
          areaStyle: { color: 'rgba(255,107,43,0.1)' },
          itemStyle: { color: '#ff6b2b' },
        },
        {
          type: 'radar',
          name: '初中',
          data: [{ value: schoolTypeValues['初中'], name: '初中' }],
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#3b82f6', width: 2 },
          areaStyle: { color: 'rgba(59,130,246,0.1)' },
          itemStyle: { color: '#3b82f6' },
        },
        {
          type: 'radar',
          name: '九年制',
          data: [{ value: schoolTypeValues['九年制'], name: '九年制' }],
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#22c55e', width: 2 },
          areaStyle: { color: 'rgba(34,197,94,0.1)' },
          itemStyle: { color: '#22c55e' },
        },
      ],
    };

    const chart = mountEcharts(chartRef.current, option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, inline]);

  const insight = getIndicatorRadarInsight(data);

  return (
    <FlipCard
      front={
        <div
          className={`card-border glow-purple relative overview-chart-card${inline ? ' overview-chart-card--inline-radar chart-card--compact' : ''}`}
          style={{ '--tw-glow-color': 'rgba(139,92,246,0.1)' } as React.CSSProperties}
        >
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <div className="chart-card-header">
            <div className="chart-card-title-wrap">
              <div className="chart-card-title">三种学校类型对比</div>
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
