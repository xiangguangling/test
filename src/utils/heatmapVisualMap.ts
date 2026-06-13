/** 高对比度热力图色带：低分深红 → 高分翠绿 */
export const HEATMAP_COLOR_SCALE = [
  '#7f1d1d',
  '#ef4444',
  '#ff6b2b',
  '#f59e0b',
  '#22c55e',
  '#059669',
];

type HeatmapPoint = [number, number, number];

type VisualMapLayout = {
  orient?: 'horizontal' | 'vertical';
  left?: string | number;
  right?: string | number;
  top?: string | number;
  bottom?: string | number;
  itemWidth?: number;
  itemHeight?: number;
};

function extractValues(data: HeatmapPoint[]): number[] {
  return data.map((d) => d[2]).filter((v) => Number.isFinite(v));
}

/** 根据当前热力图数值自动计算 visualMap 范围，放大组内差异 */
export function getHeatmapValueRange(data: HeatmapPoint[]): { min: number; max: number } {
  const values = extractValues(data);
  if (values.length === 0) return { min: 0, max: 100 };

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;

  if (range <= 0) {
    const center = dataMin;
    return {
      min: Math.max(0, +(center - 5).toFixed(1)),
      max: Math.min(100, +(center + 5).toFixed(1)),
    };
  }

  // 数值集中时收窄色阶，避免全部挤在同一颜色区间
  const pad = range < 12 ? Math.max(1, range * 0.12) : Math.max(0.5, range * 0.06);
  let min = +(dataMin - pad).toFixed(1);
  let max = +(dataMax + pad).toFixed(1);

  if (max - min < 8) {
    const mid = (dataMin + dataMax) / 2;
    min = Math.max(0, +(mid - 4).toFixed(1));
    max = Math.min(100, +(mid + 4).toFixed(1));
  }

  min = Math.max(0, min);
  max = Math.min(100, max);
  if (max <= min) max = Math.min(100, min + 1);

  return { min, max };
}

export function buildHeatmapLabelStyle(fontSize = 10) {
  return {
    show: true,
    fontSize,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    textBorderColor: 'rgba(0, 0, 0, 0.85)',
    textBorderWidth: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowBlur: 4,
  };
}

export function buildHeatmapVisualMap(data: HeatmapPoint[], layout: VisualMapLayout = {}) {
  const { min, max } = getHeatmapValueRange(data);

  return {
    min,
    max,
    calculable: false,
    precision: 1,
    orient: layout.orient ?? 'vertical',
    left: layout.left,
    right: layout.right,
    top: layout.top,
    bottom: layout.bottom,
    itemWidth: layout.itemWidth ?? 14,
    itemHeight: layout.itemHeight,
    inRange: { color: HEATMAP_COLOR_SCALE },
    textStyle: { color: '#9292C1', fontSize: 9 },
    formatter: (value: number) => `${value}%`,
  };
}

/** 0~1 得分率热力图色带：最低分红色 → 最高分紫色 */
export const RATE_HEATMAP_COLORS = ['#FF2D2E', '#FFBA69', '#66C8FF', '#8676FF'];

/** 按表中实际最低/最高得分率映射色阶（0~1） */
export function getRateHeatmapValueRange(data: HeatmapPoint[]): { min: number; max: number } {
  const values = extractValues(data);
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  let max = Math.max(...values);
  if (max <= min) max = min + 0.001;
  return { min, max };
}

export function buildRateHeatmapVisualMap(data: HeatmapPoint[], layout: VisualMapLayout = {}) {
  const { min, max } = getRateHeatmapValueRange(data);
  return {
    min,
    max,
    calculable: false,
    orient: layout.orient ?? 'vertical',
    left: layout.left,
    right: layout.right ?? 0,
    top: layout.top ?? 'center',
    bottom: layout.bottom,
    inRange: { color: RATE_HEATMAP_COLORS },
    textStyle: { color: '#9292C1', fontSize: 9 },
    formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
  };
}

type CrossAnalysis = Record<string, Record<string, number>>;

/** 指标 × 学校类型热力图（得分率 0~1） */
export function buildSchoolTypeHeatmapOption(
  indicators: { key: string; name: string }[],
  crossAnalysis: CrossAnalysis,
  schoolTypes: readonly string[] = ['小学', '初中', '九年制'],
) {
  const heatData: HeatmapPoint[] = [];
  indicators.forEach((ind, xi) => {
    schoolTypes.forEach((st, yi) => {
      const v = crossAnalysis[st]?.[ind.key] ?? 0;
      if (v > 0) heatData.push([xi, yi, +v.toFixed(3)]);
    });
  });

  return {
    tooltip: {
      formatter: (p: { value: [number, number, number] }) =>
        `${indicators[p.value[0]]?.name ?? ''} · ${schoolTypes[p.value[1]]}<br/>得分率: <b>${(p.value[2] * 100).toFixed(1)}%</b>`,
    },
    grid: { left: '12%', right: '8%', top: '10%', bottom: '12%' },
    xAxis: {
      type: 'category' as const,
      data: indicators.map(i => i.name),
      axisLabel: {
        color: '#9292C1',
        fontSize: 8,
        overflow: 'break' as const,
        width: 60,
        interval: 0,
      },
    },
    yAxis: {
      type: 'category' as const,
      data: [...schoolTypes],
      axisLabel: { color: '#383874', fontSize: 11 },
    },
    visualMap: buildRateHeatmapVisualMap(heatData, { orient: 'vertical', right: 0, top: 'center' }),
    series: [{
      type: 'heatmap' as const,
      data: heatData,
      label: {
        show: true,
        fontSize: 9,
        color: '#fff',
        formatter: (p: { value: [number, number, number] }) => `${(p.value[2] * 100).toFixed(0)}%`,
      },
      itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#fff' },
    }],
  };
}
