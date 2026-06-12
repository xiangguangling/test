import { useState, useCallback, useRef } from 'react';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

export default function FlipCard({ front, back, className = '' }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 不拦截 canvas（ECharts）的点击
    if (target.tagName === 'CANVAS') return;
    // 不拦截按钮和链接
    if (target.closest('button, a, [data-no-flip]')) return;
    setIsFlipped(prev => !prev);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
  }, []);

  // 如果拖拽了超过5px，不触发翻转（避免和图表zoom冲突）
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      return; // was a drag, don't flip
    }
  }, []);

  return (
    <div
      className={`flip-card-wrapper h-full${isFlipped ? ' flip-card-wrapper--flipped' : ''} ${className}`.trim()}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className={`flip-card h-full ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front h-full">
          {front}
        </div>
        <div className="flip-card-back h-full">
          {back}
        </div>
      </div>
    </div>
  );
}
