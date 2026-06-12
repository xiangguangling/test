import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import type { SeriesOption } from 'echarts';

/** 全局图表入场动画默认值 — 修改动画请只改此处 */
export const chartEntranceAnimation: EChartsCoreOption = {
  animation: true,
  animationDuration: 1200,
  animationEasing: 'cubicOut',
  animationDurationUpdate: 800,
  animationEasingUpdate: 'cubicInOut',
};

const DEFAULT_DURATION = chartEntranceAnimation.animationDuration as number;
const RADAR_SPOKE_DURATION_MS = 1400;
const SANKEY_LINK_ANIM_MS = 1600;

function hasRadarSeries(option: EChartsCoreOption): boolean {
  const series = option.series;
  return Array.isArray(series) && series.some(s => (s as SeriesOption).type === 'radar');
}

function hasSankeySeries(option: EChartsCoreOption): boolean {
  const series = option.series;
  return Array.isArray(series) && series.some(s => (s as SeriesOption).type === 'sankey');
}

function isElementVisible(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  return rect.width >= 2 && rect.height >= 2;
}

/** 等 Figma 画布可见后再 init；不与卡片 CSS 入场动画串行等待，避免整页长时间空白 */
export function waitForChartReveal(el: HTMLElement, maxWaitMs = 4000): Promise<void> {
  return new Promise(resolve => {
    const started = performance.now();

    const tick = () => {
      if (!el.isConnected || performance.now() - started > maxWaitMs) {
        resolve();
        return;
      }

      if (!isElementVisible(el)) {
        requestAnimationFrame(tick);
        return;
      }

      resolve();
    };

    tick();
  });
}

function enhanceSeriesAnimation(item: SeriesOption, index: number, baseDuration: number): SeriesOption {
  if (item.animation === false) return item;

  const base = {
    animationDuration: baseDuration,
    animationEasing: chartEntranceAnimation.animationEasing,
    animationDurationUpdate: chartEntranceAnimation.animationDurationUpdate,
    animationEasingUpdate: chartEntranceAnimation.animationEasingUpdate,
    animationDelay: index * 80,
    ...item,
    animation: true,
  };

  if (item.type === 'gauge') {
    return {
      ...base,
      animationDuration: item.animationDuration ?? 1400,
      animationDelay: item.animationDelay ?? index * 120,
    };
  }

  if (item.type === 'radar') {
    return {
      ...base,
      animationDuration: item.animationDuration ?? 1200,
      animationDelay: item.animationDelay ?? index * 100,
    };
  }

  if (item.type === 'line' || item.type === 'bar' || item.type === 'scatter') {
    return {
      ...base,
      animationDuration: item.animationDuration ?? baseDuration,
    };
  }

  if (item.type === 'sankey') {
    return {
      ...base,
      animationDuration: item.animationDuration ?? SANKEY_LINK_ANIM_MS,
      animationEasing: 'cubicOut',
    };
  }

  return base;
}

/** 为 ECharts option 合并入场动画；已显式 animation:false 的项不会被覆盖 */
export function withChartAnimation(option: EChartsCoreOption): EChartsCoreOption {
  if (option.animation === false) return option;

  const baseDuration =
    typeof option.animationDuration === 'number' ? option.animationDuration : DEFAULT_DURATION;

  const merged = { ...chartEntranceAnimation, ...option };
  const series = merged.series;

  if (!Array.isArray(series)) return merged;

  return {
    ...merged,
    series: series.map((s, i) => enhanceSeriesAnimation(s as SeriesOption, i, baseDuration)),
  };
}

export function getChartAnimationMs(option: EChartsCoreOption): number {
  if (option.animation === false) return 0;
  if (hasRadarSeries(option)) return RADAR_SPOKE_DURATION_MS;

  const baseDuration =
    typeof option.animationDuration === 'number' ? option.animationDuration : DEFAULT_DURATION;

  const series = option.series;
  if (!Array.isArray(series)) return baseDuration;

  let maxEnd = baseDuration;
  for (const s of series) {
    const item = s as SeriesOption;
    if (item.animation === false) continue;
    const dur =
      typeof item.animationDuration === 'number' ? item.animationDuration : baseDuration;
    const delay = typeof item.animationDelay === 'number' ? item.animationDelay : 0;
    maxEnd = Math.max(maxEnd, delay + dur);
  }
  return maxEnd;
}

export function observeChartResize(el: HTMLElement, onResize: () => void) {
  let timer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(onResize, 80);
  });
  ro.observe(el);
  return () => {
    clearTimeout(timer);
    ro.disconnect();
  };
}

export type ChartViewportObserveOptions = {
  root?: Element | null;
  threshold?: number;
  rootMargin?: string;
  /** 可见比例超过此值视为进入视口（默认 0.2，避免边缘抖动） */
  enterThreshold?: number;
  /** 可见比例低于此值视为离开视口（默认 0.04） */
  leaveThreshold?: number;
  /** 完全滚出滚动容器后才算离开（用于 tab 页长列表滚动） */
  leaveWhenFullyHidden?: boolean;
};

const REPLAY_COOLDOWN_MS = 800;

export function getViewportIntersectionRatio(el: HTMLElement, root: Element | null): number {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return 0;
  const area = rect.width * rect.height;

  if (root) {
    const rootRect = root.getBoundingClientRect();
    const h = Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top);
    const w = Math.min(rect.right, rootRect.right) - Math.max(rect.left, rootRect.left);
    return (Math.max(0, h) * Math.max(0, w)) / area;
  }

  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const h = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  const w = Math.min(rect.right, vw) - Math.max(rect.left, 0);
  return (Math.max(0, h) * Math.max(0, w)) / area;
}

function resolveEntranceReplayOptions(el: HTMLElement): ChartViewportObserveOptions {
  const scrollRoot = resolveChartScrollRoot(el);
  const isOverview = scrollRoot?.classList.contains('page-content--overview');
  if (scrollRoot) {
    return {
      root: scrollRoot,
      enterThreshold: isOverview ? 0.06 : 0.32,
      leaveThreshold: 0.02,
      leaveWhenFullyHidden: true,
    };
  }
  return {
    enterThreshold: 0.06,
    leaveThreshold: 0.03,
  };
}

/** 等图表卡片滚入视口后再播放入场动画（仅作兜底，常规流程用 observeChartEntrancePlay） */
export function waitForChartViewport(
  el: HTMLElement,
  opts: { ratio?: number; timeout?: number } = {},
): Promise<void> {
  const target = resolveChartReplayTarget(el);
  const replayOpts = resolveEntranceReplayOptions(el);
  const ratio = opts.ratio ?? 0.04;
  const root = replayOpts.root ?? null;
  const timeout = opts.timeout ?? 400;

  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };

    if (getViewportIntersectionRatio(target, root) >= ratio) {
      finish();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= ratio) finish();
      },
      { root, threshold: [0, ratio, 0.25, 0.5, 0.75], rootMargin: '0px' },
    );

    observer.observe(target);
    let attempts = 0;
    const retry = () => {
      if (done) return;
      if (getViewportIntersectionRatio(target, root) >= ratio) {
        finish();
        return;
      }
      if (attempts++ < 12) requestAnimationFrame(retry);
    };
    requestAnimationFrame(retry);
    const timer = window.setTimeout(finish, timeout);
  });
}

export function resolveChartScrollRoot(el: HTMLElement): HTMLElement | null {
  return el.closest('.page-content') as HTMLElement | null;
}

function buildViewportThresholds(enter: number, leave: number): number[] {
  return [...new Set([0, leave, enter, 0.35, 0.5, 0.75, 1])].sort((a, b) => a - b);
}

/** 图表卡片进入/离开视口（用于 CSS 动画重置） */
export function observeChartViewportToggle(
  el: HTMLElement,
  onEnter: () => void,
  onLeave?: () => void,
  opts: ChartViewportObserveOptions = {},
): () => void {
  const {
    root = null,
    threshold = 0.12,
    rootMargin = '0px',
    enterThreshold = Math.max(threshold, 0.2),
    leaveThreshold = 0.04,
    leaveWhenFullyHidden = false,
  } = opts;
  let wasIntersecting = false;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      const ratio = entry.intersectionRatio;
      const hasLeftViewport = leaveWhenFullyHidden
        ? !entry.isIntersecting
        : ratio <= leaveThreshold;

      if (!wasIntersecting && ratio >= enterThreshold) {
        onEnter();
        wasIntersecting = true;
        return;
      }
      if (wasIntersecting && hasLeftViewport) {
        onLeave?.();
        wasIntersecting = false;
      }
    },
    {
      root,
      threshold: buildViewportThresholds(enterThreshold, leaveThreshold),
      rootMargin,
    },
  );

  observer.observe(el);

  const syncInitial = () => {
    if (wasIntersecting) return;
    const ratio = getViewportIntersectionRatio(el, root);
    if (ratio >= enterThreshold) {
      onEnter();
      wasIntersecting = true;
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(syncInitial));

  return () => observer.disconnect();
}

export function resolveChartReplayTarget(el: HTMLElement): HTMLElement {
  return (
    (el.closest(
      '.overview-chart-cell, .chart-card, .overview-chart-card, .flip-card-wrapper',
    ) as HTMLElement | null) ?? el
  );
}

/** 首次进入视口 + 离开后再进入时播放 ECharts 入场动画 */
export function observeChartEntrancePlay(
  el: HTMLElement,
  onPlay: () => void,
  opts: ChartViewportObserveOptions = {},
): () => void {
  let hasLeft = false;
  let lastPlayAt = 0;

  const playOpts = { ...resolveEntranceReplayOptions(el), ...opts };

  return observeChartViewportToggle(
    el,
    () => {
      const isFirstPlay = lastPlayAt === 0;
      if (!isFirstPlay) {
        if (!hasLeft) return;
        const now = Date.now();
        if (now - lastPlayAt < REPLAY_COOLDOWN_MS) {
          hasLeft = false;
          return;
        }
      }
      lastPlayAt = Date.now();
      hasLeft = false;
      onPlay();
    },
    () => {
      hasLeft = true;
    },
    playOpts,
  );
}

/** 离开视口后再次进入时重播 ECharts 入场动画 */
export function observeChartEntranceReplay(
  el: HTMLElement,
  onReplay: () => void,
  opts: ChartViewportObserveOptions = {},
): () => void {
  return observeChartEntrancePlay(el, onReplay, opts);
}

type ChartLike = {
  setOption: (option: EChartsCoreOption, opts?: object) => void;
  isDisposed: () => boolean;
  resize?: () => void;
  off?: (event: string) => void;
  on?: (event: string, handler: () => void) => void;
};

function zeroGaugeData(
  data: SeriesOption['data'],
  min: number,
): NonNullable<SeriesOption['data']> {
  if (!Array.isArray(data)) return [{ value: min }];
  return data.map(entry => {
    if (typeof entry === 'number') return min;
    if (entry && typeof entry === 'object' && 'value' in entry) {
      return { ...(entry as Record<string, unknown>), value: min };
    }
    return { value: min };
  }) as NonNullable<SeriesOption['data']>;
}

function zeroNumericData(data: SeriesOption['data']): NonNullable<SeriesOption['data']> {
  if (!Array.isArray(data)) return [];
  return data.map(entry => {
    if (typeof entry === 'number') return 0;
    if (Array.isArray(entry)) return entry.map(() => 0);
    if (entry && typeof entry === 'object' && 'value' in entry) {
      const v = (entry as { value: unknown }).value;
      if (typeof v === 'number') return { ...(entry as Record<string, unknown>), value: 0 };
      if (Array.isArray(v)) return { ...(entry as Record<string, unknown>), value: v.map(() => 0) };
    }
    return 0;
  }) as NonNullable<SeriesOption['data']>;
}

/** 将 series 数据置为起始值（0 或 min），用于两阶段入场 */
function buildZeroSeries(item: SeriesOption): SeriesOption {
  if (item.animation === false) return { ...item, animation: false };

  switch (item.type) {
    case 'gauge': {
      const min = typeof item.min === 'number' ? item.min : 0;
      return {
        ...item,
        animation: false,
        data: zeroGaugeData(item.data, min),
      } as SeriesOption;
    }
    case 'radar':
      return { ...item, animation: false, data: zeroNumericData(item.data) } as SeriesOption;
    case 'line':
    case 'bar':
      return { ...item, animation: false, data: zeroNumericData(item.data) } as SeriesOption;
    default:
      return { ...item, animation: false };
  }
}

function buildZeroOption(option: EChartsCoreOption): EChartsCoreOption {
  const series = option.series;
  if (!Array.isArray(series)) return { ...option, animation: false };
  return {
    ...option,
    animation: false,
    series: series.map(s => buildZeroSeries(s as SeriesOption)),
  };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function lerpRadarSeries(series: SeriesOption[], progress: number, hideSymbol: boolean): SeriesOption[] {
  return series.map(s => {
    if (s.type !== 'radar' || !Array.isArray(s.data)) return s;

    const data = s.data.map(entry => {
      const item = entry as { value?: number[]; name?: string };
      const target = Array.isArray(item.value) ? item.value : [];
      return {
        ...item,
        value: target.map(v => v * progress),
      };
    });

    return {
      ...s,
      animation: false,
      ...(hideSymbol ? { symbol: 'none', showSymbol: false } : {}),
      data,
    } as SeriesOption;
  });
}

const radarAnimHandles = new WeakMap<ChartLike, number>();
const entranceAnimating = new WeakMap<ChartLike, boolean>();

export function isChartEntranceAnimating(chart: ChartLike): boolean {
  return entranceAnimating.get(chart) === true;
}

function cancelRadarSpokeEntrance(chart: ChartLike) {
  const prev = radarAnimHandles.get(chart);
  if (prev != null) {
    cancelAnimationFrame(prev);
    radarAnimHandles.delete(chart);
  }
  entranceAnimating.delete(chart);
}

/** 雷达专用：逐帧从中心插值各轴数值，彩色边线随多边形一起向外展开 */
function applyRadarSpokeEntrance(chart: ChartLike, option: EChartsCoreOption) {
  cancelRadarSpokeEntrance(chart);
  entranceAnimating.set(chart, true);

  const animated = withChartAnimation(option);
  const baseSeries = animated.series as SeriesOption[];
  const zero = buildZeroOption(animated);

  chart.setOption(
    {
      ...zero,
      series: lerpRadarSeries(baseSeries, 0, true),
    },
    { notMerge: true, lazyUpdate: false },
  );

  const start = performance.now();

  const frame = (now: number) => {
    if (chart.isDisposed()) {
      cancelRadarSpokeEntrance(chart);
      return;
    }

    const t = easeOutCubic(Math.min(1, (now - start) / RADAR_SPOKE_DURATION_MS));
    chart.setOption(
      { series: lerpRadarSeries(baseSeries, t, true) },
      { notMerge: false, lazyUpdate: true, silent: true },
    );

    if (t < 1) {
      radarAnimHandles.set(chart, requestAnimationFrame(frame));
    } else {
      radarAnimHandles.delete(chart);
      entranceAnimating.delete(chart);
      chart.setOption(animated, { notMerge: false, lazyUpdate: false });
    }
  };

  radarAnimHandles.set(chart, requestAnimationFrame(frame));
}


/** Sankey 用静态布局直接绘制，避免 ECharts 动画后连线错位与二次重绘卡顿 */
function buildSankeyStaticOption(option: EChartsCoreOption): EChartsCoreOption {
  const series = option.series;
  if (!Array.isArray(series)) return { ...option, animation: false };

  return {
    ...option,
    animation: false,
    series: series.map(s => {
      const item = s as SeriesOption;
      if (item.type !== 'sankey') return item;
      return { ...item, animation: false, animationDuration: 0 };
    }),
  };
}

type SankeySeriesOption = SeriesOption & {
  lineStyle?: { opacity?: number; curveness?: number; color?: string };
  label?: { opacity?: number; color?: string; fontSize?: number; position?: string };
  data?: { name: string; itemStyle?: { opacity?: number } }[];
};

/** 手动透明度渐入：布局一次算准，不依赖 Sankey 内置 value 动画 */
function applySankeyEntrance(
  chart: ChartLike,
  option: EChartsCoreOption,
  host?: HTMLElement,
) {
  const staticOption = buildSankeyStaticOption(option);
  const baseSeries = (staticOption.series as SankeySeriesOption[])?.[0];
  if (!baseSeries) return;

  const lineOpacity = baseSeries.lineStyle?.opacity ?? 0.25;
  let attempts = 0;
  let rafId = 0;

  const lerpSeries = (t: number): SankeySeriesOption =>
    ({
      ...baseSeries,
      animation: false,
      itemStyle: { opacity: t },
      lineStyle: { ...baseSeries.lineStyle, opacity: lineOpacity * t },
      label: baseSeries.label ? { ...baseSeries.label, opacity: t } : { opacity: t },
      data: Array.isArray(baseSeries.data)
        ? baseSeries.data.map(node => {
            const n = node as { name: string; itemStyle?: { opacity?: number; color?: string } };
            return {
              ...n,
              itemStyle: { ...n.itemStyle, opacity: t },
            };
          })
        : baseSeries.data,
    }) as SankeySeriesOption;

  const apply = () => {
    if (chart.isDisposed()) return;

    if (host) {
      const { clientWidth, clientHeight } = host;
      if ((clientWidth < 2 || clientHeight < 2) && attempts < 80) {
        attempts += 1;
        rafId = requestAnimationFrame(apply);
        return;
      }
    }

    chart.resize?.();
    chart.setOption(
      { ...staticOption, series: [lerpSeries(0)] },
      { notMerge: true, lazyUpdate: false },
    );

    const start = performance.now();
    const tick = (now: number) => {
      if (chart.isDisposed()) return;

      const t = easeOutCubic(Math.min(1, (now - start) / SANKEY_LINK_ANIM_MS));
      chart.setOption(
        { series: [lerpSeries(t)] },
        { notMerge: false, lazyUpdate: true, silent: true },
      );

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        chart.setOption(staticOption, { notMerge: true, lazyUpdate: false });
        chart.resize?.();
      }
    };

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(apply);
}

/**
 * 两阶段入场：先渲染零值，再过渡到目标值，确保 gauge/雷达/折线有可见过程。
 * 卡片 CSS 弹出与 ECharts 数据动画分离，互不影响。
 */
export function applyChartEntranceAnimation(
  chart: ChartLike,
  option: EChartsCoreOption,
  opts?: { notMerge?: boolean; host?: HTMLElement },
) {
  if (option.animation === false) {
    chart.setOption(option, { notMerge: opts?.notMerge ?? false });
    return;
  }

  if (hasRadarSeries(option)) {
    applyRadarSpokeEntrance(chart, option);
    return;
  }

  if (hasSankeySeries(option)) {
    applySankeyEntrance(chart, option, opts?.host);
    return;
  }

  const animated = withChartAnimation(option);
  const zero = buildZeroOption(animated);

  chart.setOption(zero, { notMerge: true, lazyUpdate: false });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (chart.isDisposed()) return;
      chart.setOption(animated, { notMerge: false, lazyUpdate: false });
    });
  });
}

export function mountEcharts(
  el: HTMLElement,
  option: EChartsCoreOption,
  theme?: string | object,
  mountOpts?: { skipEntranceReplay?: boolean; skipRevealWait?: boolean; skipViewportWait?: boolean },
) {
  const sankey = hasSankeySeries(option);
  const animMs = sankey ? SANKEY_LINK_ANIM_MS : getChartAnimationMs(withChartAnimation(option));

  const chart = echarts.init(el, theme);

  const resize = () => {
    if (el.isConnected) chart.resize();
  };

  let unobserve = () => {};
  let unobserveReplay = () => {};
  let obsTimer = 0;

  const startResizeObserver = () => {
    obsTimer = window.setTimeout(() => {
      unobserve = observeChartResize(el, resize);
      resize();
    }, animMs + 80);
  };

  const mountChart = () => {
    if (!el.isConnected || chart.isDisposed()) return;

    const replayTarget = resolveChartReplayTarget(el);
    let resizeStarted = false;

    const play = () => {
      if (!el.isConnected || chart.isDisposed()) return;
      chart.resize();
      applyChartEntranceAnimation(chart, option, { host: el });
      if (!resizeStarted) {
        resizeStarted = true;
        startResizeObserver();
      }
    };

    if (mountOpts?.skipEntranceReplay) {
      startResizeObserver();
    } else {
      unobserveReplay = observeChartEntrancePlay(replayTarget, play);
    }
  };

  if (mountOpts?.skipRevealWait) {
    mountChart();
  } else {
    void waitForChartReveal(el).then(mountChart);
  }

  const nativeDispose = chart.dispose.bind(chart);
  chart.dispose = () => {
    clearTimeout(obsTimer);
    unobserve();
    unobserveReplay();
    nativeDispose();
  };

  return chart;
}
