import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TreeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DashboardData } from '../types';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';
import { getIndicatorSunburstInsight } from './ChartInsights';
import { mountEcharts } from '../utils/chartResize';

echarts.use([TreeChart, TooltipComponent, CanvasRenderer]);

const shortNames: Record<string, string> = {
  'A1.1得分率': '班级数与班额数', 'A1.2得分率': '单一校区学生总数',
  'A2.1得分率': '卫生保健室配置', 'A2.2.1得分率': '食堂等级达标',
  'A2.2.2得分率': '校内小卖部达标', 'A2.3.1得分率': '饮用水卫生',
  'A2.3.2得分率': '厕所卫生', 'A3.1.2得分率': '出入口安全措施',
  'A3.1.1得分率': '危房情况', 'A3.2.1得分率': '保卫人员配备',
  'A3.2.2得分率': '宿舍管理员配备',
  'B1.2-①生均校舍建筑面积得分率': '生均校舍面积',
  'B1.2-②生均用地面积得分率': '生均用地面积',
  'B2.1-①校园办公用房面积得分率': '办公用房达标',
  'B2.1-②校园生活服务用房得分率': '生活用房达标',
  'B2.1-③住宿生床位配备得分率': '住宿生床位',
  'B3.1-①生均图书册数得分率': '生均图书册数',
  'B3.2-①图书资源配备得分率': '图书馆阅览室',
  'B4.1-①教学仪器设备配备得分率': '教学仪器设备',
  'B4.2-①音体美器材配备情况得分率': '音体美器材',
  'B5.1-①无线网覆盖得分率': '无线网覆盖',
  'B5.1-②师机比得分率': '师机比',
  'B5.1-③生机比得分率': '生机比',
  'B6.1-①体育运动场(馆)得分率': '体育运动场',
  'B6.1-②篮、排球场地得分率': '篮排球场地',
  'B6.1-③跑道长度得分率': '跑道长度',
  'B7.1-①生均绿地面积得分率': '生均绿地面积',
  'B1.1-②普通教室数得分率': '普通教室数',
  'B1.1-①得分率': '通风采光照明',
  'B1.1-③专用教室面积得分率': '专用教室面积',
  'B1.1-④公共教学用房得分率': '公共教学用房',
  'C1.1-①得分率': '教职工数达标', 'C1.3-①得分率': '骨干教师数',
  'C2.1-①得分率': '教师资格证', 'C3.1-①得分率': '教师培训时间',
  'C3.2-①得分率': '教师培训经费', 'C4.1-①得分率': '音体美教师',
  'C5.1-①得分率': '心理教师配备', 'C5.2-①得分率': '校医保健人员',
  'C6.1-①得分率': '学生体育活动', 'C6.2-①得分率': '体质健康测试',
  'C2.3-①得分率': '中高级职称教师', 'C2.2-①得分率': '专任教师学历',
  'C1.2-①得分率': '学校生师比',
};

const categoryColors: Record<string, { main: string; light: string }> = {
  'A类-学校管理与安全': { main: '#3b82f6', light: '#3b82f688' },
  'B类-办学硬件与环境': { main: '#ff6b2b', light: '#ff6b2b88' },
  'C类-师资队伍与发展': { main: '#8b5cf6', light: '#8b5cf688' },
};

function getColor(avgRate: number, baseColor: string): string {
  // Worse rates → brighter (alert) colors; good rates → subtle colors
  if (avgRate < 0.5) return '#ef4444';
  if (avgRate < 0.7) return '#ff6b2b';
  if (avgRate < 0.85) return '#f59e0b';
  if (avgRate < 0.95) return '#22c55e';
  return baseColor;
}

export default function IndicatorSunburst({ data }: { data: DashboardData }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Build radial tree data: Root → Category(A/B/C) → Sub-group → Indicator
    const indicators = data.indicators.filter(ind => ind.key !== '得分率');
    const grouped: Record<string, typeof indicators> = {};
    for (const ind of indicators) {
      const cat = ind.category || '其他';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ind);
    }

    // Sub-group mapping for each indicator
    const getGroup = (key: string): string => {
      if (key.startsWith('A1.1') || key.startsWith('A1.2')) return 'A1.教学规模';
      if (key.startsWith('A2')) return 'A2.校园卫生';
      if (key.startsWith('A3')) return 'A3.校园安全';
      if (key.startsWith('B1.1')) return 'B1.教学用房';
      if (key.startsWith('B1.2')) return 'B1.校舍用地';
      if (key.startsWith('B2')) return 'B2.办公生活';
      if (key.startsWith('B3')) return 'B3.图书配置';
      if (key.startsWith('B4')) return 'B4.教学仪器';
      if (key.startsWith('B5')) return 'B5.信息化';
      if (key.startsWith('B6')) return 'B6.体育用地';
      if (key.startsWith('B7')) return 'B7.校园绿地';
      if (key.startsWith('C1')) return 'C1.编制设置';
      if (key.startsWith('C2')) return 'C2.学历职称';
      if (key.startsWith('C3')) return 'C3.教师培训';
      if (key.startsWith('C4')) return 'C4.音体美';
      if (key.startsWith('C5')) return 'C5.心理卫生';
      if (key.startsWith('C6')) return 'C6.学生发展';
      return '其他';
    };

    // Get color by score rate
    const rateColor = (rate: number): string => {
      if (rate < 0.5) return '#ef4444';
      if (rate < 0.7) return '#ff6b2b';
      if (rate < 0.85) return '#f59e0b';
      if (rate < 0.95) return '#22c55e';
      return '#3b82f6';
    };

    // Build tree
    const treeChildren: any[] = [];
    for (const [cat, items] of Object.entries(grouped)) {
      const catColor = categoryColors[cat]?.main || '#888';
      const catName = cat.replace('A类-', 'A. ').replace('B类-', 'B. ').replace('C类-', 'C. ');

      // Group by sub-group
      const subGroups: Record<string, typeof items> = {};
      for (const ind of items) {
        const sg = getGroup(ind.key);
        if (!subGroups[sg]) subGroups[sg] = [];
        subGroups[sg].push(ind);
      }

      const subChildren = Object.entries(subGroups).map(([sg, sgItems]) => ({
        name: sg,
        itemStyle: { color: catColor, borderColor: '#E8ECF4', borderWidth: 1 },
        children: sgItems.map(ind => {
          const color = rateColor(ind.avg_rate);
          return {
            name: `${shortNames[ind.key] || ind.name}\n[${(ind.avg_rate * 100).toFixed(1)}%]`,
            value: ind.fail_count || 1,
            itemStyle: { color, borderColor: '#FFFFFF', borderWidth: 1 },
            label: { color },
          };
        }),
      }));

      treeChildren.push({
        name: catName,
        itemStyle: { color: catColor, borderColor: '#DBDFF1', borderWidth: 2 },
        children: subChildren,
      });
    }

    const treeData = {
      name: '监测体系\n(44项指标)',
      itemStyle: { color: '#8676FF' },
      children: treeChildren,
    };

    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      animation: true, animationDuration: 1500, animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#FFFFFF',
        borderColor: '#E8ECF4',
        borderWidth: 1,
        textStyle: { color: '#383874', fontSize: 12 },
        formatter: (p: unknown) => {
          const pa = p as { name: string; value: number };
          if (pa.value > 1) return `<b>${pa.name.replace('\n', ' ')}</b><br/>不达标: <b>${pa.value}</b> 所`;
          return `<b>${pa.name.replace('\n', ' ')}</b>`;
        },
      },
      series: [{
        type: 'tree',
        data: [treeData],
        layout: 'radial',
        symbol: 'circle',
        symbolSize: 7,
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '12%',
        initialTreeDepth: -1,
        animationDuration: 1200,
        animationDurationUpdate: 800,
        lineStyle: { color: '#DBDFF1', width: 1.2, curveness: 0.4 },
        // 内圈：不指定 position，由 ECharts 按左右半球自动判断内外侧
        label: {
          verticalAlign: 'middle',
          align: 'center',
          color: '#383874',
          fontSize: 10,
          distance: 8,
        },
        leaves: {
          symbolSize: 3,
          // 外圈：同样不指定 position，避免右半圈往外、左半圈往内的错位
          label: {
            fontSize: 8,
            distance: 28,
            verticalAlign: 'middle',
            align: 'center',
          },
        },
        expandAndCollapse: false,
      }],
    };

    const chart = mountEcharts(chartRef.current, option);

    // 渲染后按节点方位强制外圈标签朝外，避免左右半球方向不一致
    const fixOuterLabels = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seriesModel = (chart as any).getModel().getSeriesByIndex(0);
      if (!seriesModel) return;
      const treeData2 = seriesModel.getData();
      const tree = treeData2.tree;
      const realRoot = tree.root.children[0];
      if (!realRoot) return;
      const rootLayout = realRoot.getLayout();
      if (!rootLayout) return;

      treeData2.each((dataIndex: number) => {
        const node = tree.getNodeByDataIndex(dataIndex);
        if (!node || node.children.length > 0) return;
        const layout = node.getLayout();
        if (!layout) return;
        const el = treeData2.getItemGraphicEl(dataIndex) as {
          getSymbolPath?: () => {
            setTextConfig: (cfg: Record<string, unknown>) => void;
            getTextContent?: () => { setStyle: (key: string, val: string) => void };
          };
        } | undefined;
        const symbolPath = el?.getSymbolPath?.();
        if (!symbolPath) return;

        const labelColor = node.getModel().getModel('label').get('color') as string | undefined;

        let rad = Math.atan2(layout.y - rootLayout.y, layout.x - rootLayout.x);
        if (rad < 0) rad = Math.PI * 2 + rad;
        const isLeft = layout.x < rootLayout.x;
        if (isLeft) rad -= Math.PI;

        symbolPath.setTextConfig({
          position: isLeft ? 'left' : 'right',
          distance: 28,
          rotation: -rad,
          origin: 'center',
        });
        if (labelColor) {
          symbolPath.getTextContent?.()?.setStyle('fill', labelColor);
        }
      });
    };

    chart.on('finished', fixOuterLabels);
    const fixTimer = window.setTimeout(fixOuterLabels, 1400);

    const handleResize = () => {
      chart.resize();
      fixOuterLabels();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.clearTimeout(fixTimer);
      chart.off('finished', fixOuterLabels);
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  const insight = getIndicatorSunburstInsight(data);

  return (
    <FlipCard
      front={
        <div className="card-border glow-cyan p-4 relative overview-chart-card">
          <span className="flip-hint" title="点击空白处翻转查看结论">⇄</span>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="text-accent-cyan">🌳</span>
            44项指标层级分布
          </h3>
          <div className="overview-chart-body tree-sway">
            <div ref={chartRef} className="overview-chart-canvas" />
          </div>
          <div className="flex gap-3 mt-2 text-xs text-text-muted justify-center flex-wrap overview-chart-footer">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-red" /> 严重 (&lt;50%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-orange" /> 较差 (50-70%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-yellow" /> 一般 (70-85%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-accent-green" /> 良好 (85%+)
            </span>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}
    />
  );
}
