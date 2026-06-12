import type { ReactNode } from 'react';
import { useChartViewportReveal } from '../hooks/useChartViewportReveal';

/** 概览图表容器：滚入视口时重播卡片入场 CSS */
export default function OverviewChartCell({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, className: revealClass } = useChartViewportReveal('overview-chart-reveal');

  return (
    <div ref={ref} className={`overview-chart-cell${className ? ` ${className}` : ''}`}>
      <div
        className={revealClass}
        style={{ animationDelay: revealClass ? `${delay}ms` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
