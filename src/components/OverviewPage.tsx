import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { DashboardData } from '../types';
import StatCard from './StatCard';
import OverviewChartCell from './OverviewChartCell';
import ConnectionsViz from './ConnectionsViz';
import GlobalStatisticViz from './figma/GlobalStatisticViz';
import StackedBarViz from './figma/StackedBarViz';
import AreaChartViz from './figma/AreaChartViz';
import SchoolTypeRateViz from './figma/SchoolTypeRateViz';
import RoseChartViz from './figma/RoseChartViz';
import SankeyPassFlow from './SankeyPassFlow';
import IndicatorRadar from './IndicatorRadar';
import ConcentricRadialViz from './figma/ConcentricRadialViz';
import SchoolTypeComparison from './SchoolTypeComparison';
import WeaknessBars from './WeaknessBars';
import UrbanRuralHeatmap from './UrbanRuralHeatmap';
import BottomSchoolsList from './BottomSchoolsList';
import RadialTreeViz from './RadialTreeViz';
import { OverviewScrollContext } from '../contexts/OverviewScrollContext';

function OverviewSnapSection({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`overview-snap-section ${className}`.trim()}>{children}</section>;
}

export default function OverviewPage({
  data,
  scrollContainerRef,
}: {
  data: DashboardData;
  scrollContainerRef: RefObject<HTMLElement | null>;
}) {
  const { overall } = data;
  const kpiRef = useRef<HTMLDivElement>(null);

  /** 同步 KPI / 各 snap 分页高度，避免 sticky 遮挡与底部露出下一页 */
  useEffect(() => {
    const el = scrollContainerRef.current;
    const kpi = kpiRef.current;
    if (!el || !kpi) return;

    const syncSnapLayout = () => {
      const kpiH = kpi.offsetHeight;
      if (kpiH < 1 || !el) return;

      const sectionH = Math.max(280, el.clientHeight - kpiH);

      el.style.setProperty('--overview-kpi-block', `${kpiH}px`);
      el.style.setProperty('--overview-snap-pad-top', `10px`);
      el.style.setProperty('--overview-snap-safe-bottom', `0px`);
      el.style.setProperty('--overview-snap-section-height', `${sectionH}px`);
    };

    syncSnapLayout();
    const ro = new ResizeObserver(syncSnapLayout);
    ro.observe(kpi);
    window.addEventListener('resize', syncSnapLayout);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncSnapLayout);
    };
  }, [scrollContainerRef]);

  /** 滚回顶部时 snap 会停在第一屏图表，补滚到 0 以显示指标条 */
  useEffect(() => {
    const el = scrollContainerRef.current;
    const kpi = kpiRef.current;
    if (!el || !kpi) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let settling = false;
    let gestureStartTop = el.scrollTop;

    const settleKpiTop = () => {
      if (settling) return;
      const kpiH = kpi.offsetHeight;
      if (kpiH <= 0) return;
      const st = el.scrollTop;
      const scrolledUp = st < gestureStartTop;
      if (!scrolledUp) {
        gestureStartTop = st;
        return;
      }
      if (st > 0 && st < kpiH * 0.55) {
        settling = true;
        el.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(() => {
          settling = false;
          gestureStartTop = 0;
        }, 400);
      }
    };

    const onScroll = () => {
      if (!timer) gestureStartTop = el.scrollTop;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        settleKpiTop();
      }, 150);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', settleKpiTop);
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', settleKpiTop);
    };
  }, [scrollContainerRef]);

  /** 滚轮轻推即整页切换（共 5 屏图表）；capture 阶段拦截，避免 ECharts 等子组件吞掉滚轮 */
  useEffect(() => {
    const el = scrollContainerRef.current;
    const kpi = kpiRef.current;
    if (!el || !kpi) return;

    let locked = false;
    let unlockTimer: ReturnType<typeof setTimeout> | undefined;

    const unlock = () => {
      locked = false;
      if (unlockTimer) {
        clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }
    };

    const scheduleUnlock = () => {
      if (unlockTimer) clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(unlock, 900);
    };

    const getSnapTargets = () => {
      const kpiH = kpi.offsetHeight;
      const sections = el.querySelectorAll<HTMLElement>('.overview-snap-section');
      return Array.from(sections).map((section) => {
        const top = section.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
        return Math.max(0, top - kpiH);
      });
    };

    const getCurrentIndex = (targets: number[]) => {
      const st = el.scrollTop;
      let nearest = 0;
      let minDist = Infinity;
      for (let i = 0; i < targets.length; i++) {
        const dist = Math.abs(st - targets[i]);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      return nearest;
    };

    const onWheel = (e: WheelEvent) => {
      if (!el.contains(e.target as Node)) return;
      /* 仅当 overview 内容可见（非 hidden）时才拦截滚轮，避免影响 Tab 页滚动 */
      const overviewRoot = el.querySelector('.overview-page');
      if (!overviewRoot || (overviewRoot as HTMLElement).offsetParent === null) return;

      if (locked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const targets = getSnapTargets();
      if (targets.length === 0) return;

      const current = getCurrentIndex(targets);
      const maxIndex = targets.length - 1;
      const goingDown = e.deltaY > 8;
      const goingUp = e.deltaY < -8;

      if (goingDown && current < maxIndex) {
        e.preventDefault();
        e.stopPropagation();
        locked = true;
        el.scrollTo({ top: targets[current + 1], behavior: 'smooth' });
        scheduleUnlock();
      } else if (goingUp && current > 0) {
        e.preventDefault();
        e.stopPropagation();
        locked = true;
        el.scrollTo({ top: targets[current - 1], behavior: 'smooth' });
        scheduleUnlock();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    el.addEventListener('scrollend', unlock);
    return () => {
      if (unlockTimer) clearTimeout(unlockTimer);
      el.removeEventListener('wheel', onWheel, { capture: true });
      el.removeEventListener('scrollend', unlock);
    };
  }, [scrollContainerRef]);

  return (
    <OverviewScrollContext.Provider value={scrollContainerRef}>
    <div className="overview-page">
      <div className="overview-kpi" ref={kpiRef}>
        <div className="overview-kpi-grid">
          <StatCard icon="🏫" label="监测学校总数" value={overall.total_schools} suffix="所" color="#8676FF" className="stagger-1" />
          <StatCard icon="📊" label="平均总分" value={overall.avg_score.toFixed(1)} suffix="/44" color="#023AFF" className="stagger-2" />
          <StatCard icon="✅" label="综合得分率" value={(overall.avg_rate * 100).toFixed(1)} suffix="%" color="#00B929" className="stagger-3" />
          <StatCard icon="🏆" label="满分学校" value={overall.schools_full_score} suffix="所" color="#FFBA69" className="stagger-4" />
          <StatCard icon="⚠️" label="最低得分" value={overall.min_score} suffix="分" color="#FF2D2E" className="stagger-5" />
          <StatCard icon="📈" label="≥40分占比" value={((overall.schools_above_40 / overall.total_schools) * 100).toFixed(0)} suffix="%" color="#FF708B" className="stagger-6" />
        </div>
      </div>

      <OverviewSnapSection className="overview-snap-section--hero">
        <div className="overview-hero-left">
          <div className="overview-hero-left-top">
            <OverviewChartCell delay={0}>
              <GlobalStatisticViz data={data} compact />
            </OverviewChartCell>
            <OverviewChartCell delay={120}>
              <ConcentricRadialViz data={data} hero />
            </OverviewChartCell>
          </div>
          <div className="overview-hero-left-bottom">
            <OverviewChartCell delay={80}>
              <AreaChartViz data={data} compact />
            </OverviewChartCell>
            <OverviewChartCell delay={100}>
              <SchoolTypeRateViz data={data} compact />
            </OverviewChartCell>
          </div>
        </div>
        <div className="overview-hero-right">
          <OverviewChartCell delay={160} className="overview-chart-cell--hero-half">
            <RoseChartViz data={data} heroHalf />
          </OverviewChartCell>
          <OverviewChartCell delay={180} className="overview-chart-cell--hero-half">
            <IndicatorRadar data={data} inline />
          </OverviewChartCell>
        </div>
      </OverviewSnapSection>

      <OverviewSnapSection className="overview-snap-section--compact-height">
        <OverviewChartCell delay={120}>
          <SankeyPassFlow data={data} />
        </OverviewChartCell>
        <OverviewChartCell delay={160}>
          <ConnectionsViz data={data} />
        </OverviewChartCell>
      </OverviewSnapSection>

      <OverviewSnapSection className="overview-snap-section--stacked-bar">
        <OverviewChartCell delay={0}>
          <StackedBarViz data={data} compact fillHeight />
        </OverviewChartCell>
        <OverviewChartCell delay={80}>
          <SchoolTypeComparison data={data} inline />
        </OverviewChartCell>
      </OverviewSnapSection>

      <OverviewSnapSection className="overview-snap-section--triple">
        <OverviewChartCell delay={0}>
          <WeaknessBars data={data} compact />
        </OverviewChartCell>
        <OverviewChartCell delay={80}>
          <UrbanRuralHeatmap data={data} compact />
        </OverviewChartCell>
        <OverviewChartCell delay={160}>
          <BottomSchoolsList data={data} compact />
        </OverviewChartCell>
      </OverviewSnapSection>

      <OverviewSnapSection className="overview-snap-section--radial">
        <OverviewChartCell delay={0}>
          <RadialTreeViz data={data} overview />
        </OverviewChartCell>
      </OverviewSnapSection>
    </div>
    </OverviewScrollContext.Provider>
  );
}
