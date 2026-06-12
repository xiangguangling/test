import { useEffect, useRef, type ReactNode } from 'react';

export function TabSnapSection({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`tab-snap-section ${className}`.trim()}>{children}</section>;
}

export default function TabPageLayout({
  stats,
  children,
}: {
  stats: ReactNode;
  children: ReactNode;
}) {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.querySelector('.page-content--tab') as HTMLElement | null;
    const statsEl = statsRef.current;
    if (!el || !statsEl) return;

    const syncSnapLayout = () => {
      const statsH = statsEl.offsetHeight;
      if (statsH < 1) return;

      const titleH = document.querySelector('.page-title-banner')?.getBoundingClientRect().height ?? 110;
      const footerH = document.querySelector('.app-footer')?.getBoundingClientRect().height ?? 36;
      const padTop = 10;
      const safeBottom = 14;
      const viewport = Math.max(320, window.innerHeight - titleH - footerH - statsH);
      const sectionH = Math.max(280, viewport - padTop - safeBottom);

      el.style.setProperty('--tab-stats-block', `${statsH}px`);
      el.style.setProperty('--tab-snap-pad-top', `${padTop}px`);
      el.style.setProperty('--tab-snap-safe-bottom', `${safeBottom}px`);
      el.style.setProperty('--tab-snap-section-height', `${sectionH}px`);
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };

    syncSnapLayout();
    const ro = new ResizeObserver(syncSnapLayout);
    ro.observe(statsEl);
    window.addEventListener('resize', syncSnapLayout);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncSnapLayout);
    };
  }, []);

  return (
    <div className="tab-page">
      <div className="tab-page-stats" ref={statsRef}>
        {stats}
      </div>
      {children}
    </div>
  );
}
