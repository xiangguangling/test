import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { DashboardData } from '../types';
import { useOverviewInView } from '../hooks/useOverviewInView';

const colorMap: Record<string, string> = {
  'accent-blue': 'text-[#3b82f6]',
  'accent-cyan': 'text-[#06b6d4]',
  'accent-green': 'text-[#22c45e]',
  'accent-orange': 'text-[#ff6b2b]',
};

function AnimatedNumber({ value, suffix = '', decimals = 0, play }: {
  value: number;
  suffix?: string;
  decimals?: number;
  play: boolean;
}) {
  const [displayVal, setDisplayVal] = useState('0' + suffix);
  const ref = useRef<HTMLSpanElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!play || hasPlayed.current) return;
    hasPlayed.current = true;
    const obj = { val: 0 };
    const tl = gsap.to(obj, {
      val: value,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayVal(obj.val.toFixed(decimals) + suffix);
      },
    });
    return () => { tl.kill(); };
  }, [play, value, suffix, decimals]);

  return <span ref={ref}>{displayVal}</span>;
}

export default function OverviewCards({ data }: { data: DashboardData }) {
  const { overall } = data;
  const { ref: scrollRef, inView } = useOverviewInView();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;
    const inners = containerRef.current.querySelectorAll('.overview-card-inner');
    gsap.fromTo(
      inners,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power2.out',
      },
    );
  }, [inView]);

  const cards = [
    {
      label: '监测学校总数',
      value: overall.total_schools,
      suffix: ' 所',
      icon: '🏫',
      colorClass: 'text-[#3b82f6]',
      glow: 'glow-blue',
      sub: `满分 ${overall.schools_full_score} 所 (${(overall.schools_full_score / overall.total_schools * 100).toFixed(1)}%)`,
    },
    {
      label: '平均总分',
      value: overall.avg_score,
      suffix: ' 分',
      decimals: 1,
      icon: '📊',
      colorClass: 'text-[#3b82f6]',
      glow: 'glow-cyan',
      sub: `中位数 ${overall.median_score} · 标准差 ${overall.std_score}`,
    },
    {
      label: '综合得分率',
      value: overall.avg_rate * 100,
      suffix: '%',
      decimals: 1,
      icon: '✅',
      colorClass: 'text-[#22c55e]',
      glow: 'glow-green',
      sub: `≥40分占比 ${(overall.schools_above_40 / overall.total_schools * 100).toFixed(1)}%`,
    },
    {
      label: '最低得分',
      value: overall.min_score,
      suffix: ' 分',
      icon: '⚠️',
      colorClass: 'text-[#ff6b2b]',
      glow: 'glow-orange',
      sub: `最高 ${overall.max_score} 分 · 极差 ${overall.max_score - overall.min_score}`,
    },
  ];

  return (
    <div ref={scrollRef}>
      <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`card-border ${card.glow} p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:bg-bg-card-hover cursor-default group relative overflow-hidden`}
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-60 ${i === 0 ? 'bg-accent-blue' : i === 1 ? 'bg-accent-cyan' : i === 2 ? 'bg-accent-green' : 'bg-accent-orange'}`} />
            <div className="overview-card-inner opacity-0">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs text-text-secondary tracking-wider font-medium">{card.label}</span>
              </div>
              <div className={`text-4xl font-extrabold ${card.colorClass} text-center tracking-tight`}>
                <AnimatedNumber
                  value={card.value}
                  suffix={card.suffix}
                  decimals={card.decimals || 0}
                  play={inView}
                />
              </div>
              <p className="text-xs text-text-muted mt-2.5 text-center leading-relaxed">{card.sub}</p>
            </div>
          </div>
      ))}
    </div>
    </div>
  );
}
