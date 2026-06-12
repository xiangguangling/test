import type { EChartsOption } from 'echarts';
import type { Indicator } from '../types';

export const FACILITY_SUBGROUPS: Record<string, { name: string; keys: string[] }> = {
  'B1.教学用房': {
    name: '教学用房(6分)',
    keys: ['B1.1-①得分率', 'B1.1-②普通教室数得分率', 'B1.1-③专用教室面积得分率', 'B1.1-④公共教学用房得分率', 'B1.2-①生均校舍建筑面积得分率', 'B1.2-②生均用地面积得分率'],
  },
  'B2.办公生活': {
    name: '办公生活用房(3分)',
    keys: ['B2.1-①校园办公用房面积得分率', 'B2.1-②校园生活服务用房得分率', 'B2.1-③住宿生床位配备得分率'],
  },
  'B3.图书': { name: '图书配置(2分)', keys: ['B3.1-①生均图书册数得分率', 'B3.2-①图书资源配备得分率'] },
  'B4.教学仪器': { name: '教学仪器(2分)', keys: ['B4.1-①教学仪器设备配备得分率', 'B4.2-①音体美器材配备情况得分率'] },
  'B5.信息化': { name: '校园信息化(3分)', keys: ['B5.1-①无线网覆盖得分率', 'B5.1-②师机比得分率', 'B5.1-③生机比得分率'] },
  'B6.体育': { name: '体育用地(3分)', keys: ['B6.1-①体育运动场(馆)得分率', 'B6.1-②篮、排球场地得分率', 'B6.1-③跑道长度得分率'] },
  'B7.绿地': { name: '校园绿地(1分)', keys: ['B7.1-①生均绿地面积得分率'] },
};

export const FACILITY_SHORT_NAMES: Record<string, string> = {
  'B1.1-①得分率': '通风采光',
  'B1.1-②普通教室数得分率': '普通教室',
  'B1.1-③专用教室面积得分率': '专用教室',
  'B1.1-④公共教学用房得分率': '公共教学用房',
  'B1.2-①生均校舍建筑面积得分率': '校舍面积',
  'B1.2-②生均用地面积得分率': '生均用地',
  'B2.1-①校园办公用房面积得分率': '办公用房',
  'B2.1-②校园生活服务用房得分率': '生活用房',
  'B2.1-③住宿生床位配备得分率': '住宿床位',
  'B3.1-①生均图书册数得分率': '图书册数',
  'B3.2-①图书资源配备得分率': '图书馆阅览室',
  'B4.1-①教学仪器设备配备得分率': '教学仪器',
  'B4.2-①音体美器材配备情况得分率': '音体美器材',
  'B5.1-①无线网覆盖得分率': '无线网',
  'B5.1-②师机比得分率': '师机比',
  'B5.1-③生机比得分率': '生机比',
  'B6.1-①体育运动场(馆)得分率': '运动场',
  'B6.1-②篮、排球场地得分率': '篮排球',
  'B6.1-③跑道长度得分率': '跑道',
  'B7.1-①生均绿地面积得分率': '绿地面积',
};

const FAIL_TREEMAP_COLORS = ['#8676FF', '#FF708B', '#FFBA69', '#FF2D2E'];

/** 不达标分布矩形树图：面积 = 不达标学校数，按子维度分组 */
export function buildFailCountTreemapOption(indicators: Indicator[]): EChartsOption {
  const treeData = Object.values(FACILITY_SUBGROUPS)
    .map(group => ({
      name: group.name,
      children: group.keys
        .map(key => {
          const ind = indicators.find(i => i.key === key);
          const failCount = ind?.fail_count ?? 0;
          if (failCount <= 0) return null;
          return {
            name: FACILITY_SHORT_NAMES[key] || ind?.name || key,
            value: failCount,
          };
        })
        .filter((c): c is { name: string; value: number } => c != null),
    }))
    .filter(g => g.children.length > 0);

  const failValues = treeData.flatMap(g => g.children.map(c => c.value));
  const minFail = failValues.length ? Math.min(...failValues) : 0;
  let maxFail = failValues.length ? Math.max(...failValues) : 1;
  if (maxFail <= minFail) maxFail = minFail + 1;

  return {
    tooltip: {
      formatter: (p: unknown) => {
        const item = p as { name: string; value: number };
        return `${item.name}: <b>${item.value}</b> 所不达标`;
      },
    },
    visualMap: {
      min: minFail,
      max: maxFail,
      calculable: false,
      show: failValues.length > 1,
      orient: 'vertical' as const,
      right: 4,
      top: 'center' as const,
      itemWidth: 10,
      itemHeight: 80,
      inRange: { color: FAIL_TREEMAP_COLORS },
      textStyle: { color: '#9292C1', fontSize: 9 },
    },
    series: [{
      type: 'treemap' as const,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: { show: true, fontSize: 9, color: '#fff', fontWeight: 'bold' as const },
      upperLabel: { show: true, height: 22, color: '#383874', fontSize: 10, fontWeight: 'bold' as const },
      itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
      levels: [{ itemStyle: { borderWidth: 2, gapWidth: 4 }, upperLabel: { show: true } }],
      data: treeData,
    }],
  };
}
