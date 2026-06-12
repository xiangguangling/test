import { FIGMA } from '../components/figma/figmaTheme';

/** 浅色 Figma 主题 — 供备份 Grid / 分析类图表复用 */
export const LIGHT_TOOLTIP = {
  backgroundColor: '#FFFFFF',
  borderColor: '#E8ECF4',
  borderWidth: 1,
  textStyle: { color: FIGMA.textPrimary, fontSize: 12 },
  extraCssText: 'box-shadow:0 4px 16px rgba(108,73,172,0.08);',
};

export const LIGHT_AXIS_LABEL = { color: FIGMA.textSecondary, fontSize: 10 };
export const LIGHT_AXIS_NAME = { color: FIGMA.textSecondary, fontSize: 10 };
export const LIGHT_SPLIT_LINE = { lineStyle: { color: '#F2F5FA' } };

export const LIGHT_CHART_COLORS = {
  purple: '#8676FF',
  pink: '#FF708B',
  cyan: '#66C8FF',
  green: '#00B929',
  orange: '#FFBA69',
  red: '#FF2D2E',
  blue: '#023AFF',
};

/** 3D 图表在浅色背景下的坐标轴 */
export const LIGHT_GRID3D_AXIS = { lineStyle: { color: '#DBDFF1' } };
export const LIGHT_SCATTER3D_BORDER = 'rgba(134,118,255,0.35)';
