import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { DashboardData } from '../types';
import { OverviewScrollContext } from '../contexts/OverviewScrollContext';
import CrisisAlert from './CrisisAlert';
import ScoreDistribution from './ScoreDistribution';
import IndicatorRadar from './IndicatorRadar';
import WeaknessBars from './WeaknessBars';
import SchoolTypeComparison from './SchoolTypeComparison';
import SankeyPassFlow from './SankeyPassFlow';
import UrbanRuralHeatmap from './UrbanRuralHeatmap';
import IndicatorSunburst from './IndicatorSunburst';
import BottomSchoolsList from './BottomSchoolsList';
import OverviewCards from './OverviewCards';

type PageDef = { left: ReactNode; right: ReactNode | null };

export default function OverviewPager({ data }: { data: DashboardData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  const pages: PageDef[] = useMemo(
    () => [
      {
        left: <CrisisAlert data={data} />,
        right: <ScoreDistribution data={data} />,
      },
      {
        left: <IndicatorRadar data={data} />,
        right: <WeaknessBars data={data} />,
      },
      {
        left: <SchoolTypeComparison data={data} />,
        right: null,
      },
      {
        left: <SankeyPassFlow data={data} />,
        right: <UrbanRuralHeatmap data={data} />,
      },
      {
        left: <IndicatorSunburst data={data} />,
        right: <BottomSchoolsList data={data} />,
      },
    ],
    [data]
  );

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (lockRef.current) {
        e.preventDefault();
        return;
      }

      const pageHeight = el.clientHeight;
      if (pageHeight <= 0) return;

      const current = Math.round(el.scrollTop / pageHeight);
      const maxIndex = pages.length - 1;

      if (e.deltaY > 30 && current < maxIndex) {
        e.preventDefault();
        lockRef.current = true;
        el.scrollTo({ top: (current + 1) * pageHeight, behavior: 'smooth' });
        window.setTimeout(() => { lockRef.current = false; }, 700);
      } else if (e.deltaY < -30 && current > 0) {
        e.preventDefault();
        lockRef.current = true;
        el.scrollTo({ top: (current - 1) * pageHeight, behavior: 'smooth' });
        window.setTimeout(() => { lockRef.current = false; }, 700);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [pages.length]);

  return (
    <OverviewScrollContext.Provider value={containerRef}>
      <div ref={containerRef} className="overview-pager">
        {pages.map((page, index) => (
          <section
            key={index}
            className={`overview-page${index === 0 ? ' overview-page--with-stats' : ''}`}
          >
            {index === 0 ? (
              <div className="overview-page-layout">
                <OverviewCards data={data} />
                <div className="overview-page-grid">
                  <div className="overview-chart-slot">{page.left}</div>
                  {page.right && <div className="overview-chart-slot">{page.right}</div>}
                </div>
              </div>
            ) : (
              <div className={`overview-page-grid${page.right ? '' : ' overview-page-grid--single'}`}>
                <div className="overview-chart-slot">{page.left}</div>
                {page.right && <div className="overview-chart-slot">{page.right}</div>}
              </div>
            )}
          </section>
        ))}
      </div>
    </OverviewScrollContext.Provider>
  );
}
