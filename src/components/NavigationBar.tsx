import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export type TabId = 'overview' | 'regional' | 'safety' | 'facility' | 'faculty';

const tabs: { id: TabId; label: string; icon: string; color: string }[] = [
  { id: 'overview', label: '总体概览', icon: '📊', color: '#ff6b2b' },
  { id: 'regional', label: '区域分析', icon: '🌍', color: '#3b82f6' },
  { id: 'safety', label: '安全管理', icon: '🛡️', color: '#22c45e' },
  { id: 'facility', label: '硬件设施', icon: '🏗️', color: '#06b6d4' },
  { id: 'faculty', label: '师资队伍', icon: '👩‍🏫', color: '#8b5cf6' },
];

export default function NavigationBar({
  activeTab,
  onTabChange,
  compact = false,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact?: boolean;
}) {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    const buttons = navRef.current.querySelectorAll('.nav-btn');
    gsap.fromTo(
      buttons,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out' },
    );
  }, []);

  return (
    <nav className={`sticky top-0 z-50 w-full backdrop-blur-xl bg-bg-primary/85 border-b border-border-subtle ${compact ? 'nav-compact' : ''}`}>
      <div className={`w-full px-4 flex justify-center items-center ${compact ? 'py-1.5' : 'py-2.5'}`}>
        <div ref={navRef} className={`flex items-center ${compact ? 'gap-3' : 'gap-6'}`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-btn opacity-0 relative flex items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  compact ? 'px-6 py-2.5 text-sm min-w-[7.5rem]' : 'px-10 py-3.5 text-base min-w-[9.5rem]'
                } ${
                  isActive
                    ? 'text-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-card/50'
                }`}
                style={
                  isActive
                    ? {
                        background: `${tab.color}12`,
                        boxShadow: `0 0 16px ${tab.color}18, inset 0 1px 0 ${tab.color}25`,
                        border: `1px solid ${tab.color}28`,
                      }
                    : undefined
                }
              >
                <span className={`inline-flex items-center justify-center ${compact ? 'gap-2' : 'gap-3'}`}>
                  <span
                    className={`inline-flex items-center justify-center shrink-0 leading-none ${
                      compact ? 'w-6 text-lg' : 'w-8 text-2xl'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="leading-none">{tab.label}</span>
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full"
                    style={{ background: tab.color, boxShadow: `0 0 10px ${tab.color}` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
