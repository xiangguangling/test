import type { DashboardData } from '../../types';

export const EIGHT_DIM_KEYS = [
  'B1.1-④公共教学用房得分率',
  'B5.1-③生机比得分率',
  'C2.3-①得分率',
  'B1.1-③专用教室面积得分率',
  'C1.1-①得分率',
  'C1.2-①得分率',
  'B2.1-②校园生活服务用房得分率',
  'C4.1-①得分率',
] as const;

export const EIGHT_DIM_LABELS: Record<string, string> = {
  'B1.1-④公共教学用房得分率': '公共教学用房',
  'B5.1-③生机比得分率': '生机比',
  'C2.3-①得分率': '中高级职称',
  'B1.1-③专用教室面积得分率': '专用教室',
  'C1.1-①得分率': '教职工数',
  'C1.2-①得分率': '生师比',
  'B2.1-②校园生活服务用房得分率': '生活用房',
  'C4.1-①得分率': '音体美教师',
};

export interface FigmaRadarSeries {
  name: string;
  values: number[];
}

/** 城乡八维：城市 / 县镇 / 农村 三条雷达线 */
export function buildRegionalRadar(data: DashboardData) {
  const areas = ['城市', '县镇', '农村'] as const;
  const indicators = EIGHT_DIM_KEYS.map(k => EIGHT_DIM_LABELS[k] ?? k);
  const series: FigmaRadarSeries[] = areas.map(area => ({
    name: area,
    values: EIGHT_DIM_KEYS.map(k => +(data.urban_rural_analysis[area]?.[k] ?? 0).toFixed(3)),
  }));
  return { indicators, series };
}

/** 师资八维：小学 / 初中 / 九年制 三条雷达线 */
export function buildFacultyRadar(data: DashboardData) {
  const types = ['小学', '初中', '九年制'] as const;
  const facInds = data.indicators
    .filter(i => i.category === 'C类-师资队伍与发展' && i.key !== '得分率')
    .slice(0, 8);
  const indicators = facInds.map(i =>
    i.name.length > 8 ? i.name.slice(0, 8) + '…' : i.name,
  );
  const series: FigmaRadarSeries[] = types.map(t => ({
    name: t,
    values: facInds.map(ind => +(data.cross_analysis[t]?.[ind.key] ?? 0).toFixed(3)),
  }));
  return { indicators, series };
}

/** 概览：6 项核心指标单条雷达（对应 Figma 模板 6 轴） */
export function buildOverviewRadar(data: DashboardData) {
  const types = ['小学', '初中', '九年制'] as const;
  const keys = EIGHT_DIM_KEYS.slice(0, 6);
  const indicators = keys.map(k => EIGHT_DIM_LABELS[k] ?? k);
  const values = keys.map(k => {
    const vals = types.map(t => data.cross_analysis[t]?.[k] ?? 0);
    const avg = vals.reduce((s, v) => s + v, 0) / types.length;
    return +avg.toFixed(3);
  });
  return {
    indicators,
    series: [{ name: '综合得分率', values }],
  };
}
