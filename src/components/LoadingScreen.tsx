import { memo, useEffect, useRef, useState } from 'react';
import './LoadingScreen.css';

interface Props {
  onComplete: () => void;
}

/** 背景：校园航拍图 + 深色渐变叠加 */
const LoadingBackground = memo(function LoadingBackground() {
  return (
    <div className="loading-lightfall">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(./campus-3d-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35) saturate(0.6)',
          transform: 'scale(1.05)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(2,20,60,0.3) 0%, rgba(2,7,20,0.75) 70%)',
        }}
      />
    </div>
  );
});

function LoadingOverlay({
  onComplete,
  onPhaseChange,
}: {
  onComplete: () => void;
  onPhaseChange: (phase: 'loading' | 'ready' | 'exit') => void;
}) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading');
  const fillRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onPhaseChangeRef = useRef(onPhaseChange);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onPhaseChangeRef.current = onPhaseChange;
  }, [onComplete, onPhaseChange]);

  useEffect(() => {
    const duration = 2200;
    const start = performance.now();
    let rafId = 0;
    let lastText = -1;

    const setPhaseSafe = (next: 'loading' | 'ready' | 'exit') => {
      setPhase(next);
      onPhaseChangeRef.current(next);
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - raw, 3);
      const p = raw >= 1 ? 100 : Math.min(Math.round(eased * 100), 99);
      const pct = `${p}%`;

      if (fillRef.current) fillRef.current.style.width = pct;
      if (glowRef.current) glowRef.current.style.left = pct;
      if (textRef.current && p !== lastText) {
        textRef.current.textContent = `${p}%`;
        lastText = p;
      }

      if (raw >= 1) {
        if (textRef.current) textRef.current.textContent = '100%';
        setPhaseSafe('ready');
        window.setTimeout(() => {
          setPhaseSafe('exit');
          window.setTimeout(() => onCompleteRef.current(), 600);
        }, 400);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="loading-content">
      <div className={`loading-icon-wrap ${phase === 'ready' ? 'loading-icon--pulse' : ''}`}>
        <div className="loading-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 4L58 18V46L32 60L6 46V18L32 4Z" stroke="url(#lg)" strokeWidth="1.5" fill="none" />
            <path d="M32 14L48 23V41L32 50L16 41V23L32 14Z" stroke="url(#lg2)" strokeWidth="1" fill="none" />
            <circle cx="32" cy="32" r="9" stroke="url(#lg3)" strokeWidth="1.2" fill="none" />
            <circle cx="32" cy="32" r="3" fill="url(#lg3)" opacity="0.8" />
            <defs>
              <linearGradient id="lg" x1="6" y1="4" x2="58" y2="60">
                <stop stopColor="#A6C8FF" />
                <stop offset="1" stopColor="#5227FF" />
              </linearGradient>
              <linearGradient id="lg2" x1="16" y1="14" x2="48" y2="50">
                <stop stopColor="#A6C8FF" />
                <stop offset="1" stopColor="#FF9FFC" />
              </linearGradient>
              <linearGradient id="lg3" x1="23" y1="23" x2="41" y2="41">
                <stop stopColor="#A6C8FF" />
                <stop offset="1" stopColor="#FF9FFC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <h1 className="loading-title">
        <span className="loading-title-gradient">义务教育标准化学校监测</span>
      </h1>
      <p className="loading-subtitle">
        <span className="loading-subtitle-gradient">数据可视化看板</span>
      </p>

      <div className="loading-progress-wrap">
        <div className="loading-progress-track">
          <div ref={fillRef} className="loading-progress-fill" />
          <div ref={glowRef} className="loading-progress-glow" />
        </div>
        <span ref={textRef} className="loading-progress-text">0%</span>
      </div>

      <p className="loading-hint">
        {phase === 'ready' ? '✓ 数据加载完成' : '正在加载监测数据...'}
      </p>
    </div>
  );
}

export default function LoadingScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading');

  return (
    <div className={`loading-screen ${phase === 'exit' ? 'loading-screen--exit' : ''}`}>
      <LoadingBackground />
      <LoadingOverlay onComplete={onComplete} onPhaseChange={setPhase} />
    </div>
  );
}
