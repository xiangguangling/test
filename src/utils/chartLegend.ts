/** 图例放右侧，给主图留出更多空间 */
export function buildSideLegend(
  data: string[],
  options: { fontSize?: number; right?: number | string; top?: string } = {},
) {
  return {
    data,
    orient: 'vertical' as const,
    right: options.right ?? 8,
    top: options.top ?? 'middle',
    textStyle: { color: '#9292C1', fontSize: options.fontSize ?? 10 },
    itemWidth: 10,
    itemHeight: 8,
    itemGap: 8,
  };
}

/** 带右侧图例时 grid 边距（图例占右侧，主图尽量撑满） */
export const sideLegendGrid = {
  left: '3%',
  right: '14%',
  top: '3%',
  bottom: '3%',
};

export function buildSideLegendGrid(overrides: Partial<Record<'left' | 'right' | 'top' | 'bottom', string>> = {}) {
  return { ...sideLegendGrid, containLabel: true as const, ...overrides };
}

/** 带右侧图例时 radar 布局 */
export const sideLegendRadarCenter: [string, string] = ['42%', '50%'];
export const sideLegendRadarRadius = '78%';

/** 图例放底部，主图居中 */
export function buildBottomLegend(
  data: string[],
  options: { fontSize?: number; bottom?: number; itemGap?: number } = {},
) {
  return {
    data,
    orient: 'horizontal' as const,
    bottom: options.bottom ?? 6,
    left: 'center' as const,
    textStyle: { color: '#9292C1', fontSize: options.fontSize ?? 10 },
    itemWidth: 10,
    itemHeight: 8,
    itemGap: options.itemGap ?? 16,
  };
}

/** 带底部图例时 radar 布局（Hero 半宽卡片，留边距防溢出） */
export const bottomLegendRadarCenter: [string, string] = ['50%', '50%'];
export const bottomLegendRadarRadius = '72%';

/** 带右侧图例时 pie 布局 */
export const sideLegendPieLayout = {
  center: ['40%', '50%'] as [string, string],
  radius: ['58%', '82%'] as [string, string],
};
