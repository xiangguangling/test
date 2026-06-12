import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

interface Props {
  designWidth: number;
  designHeight: number;
  children: ReactNode;
  className?: string;
  /** 填满父容器并在容器内居中缩放 */
  fillHeight?: boolean;
  /** 在 fillHeight 模式下额外放大比例 */
  scaleBoost?: number;
  /** contain=等比适配；height=按容器高度撑满（半宽卡片） */
  fillAxis?: 'contain' | 'height' | 'width';
  /** 水平居中偏移（相对容器宽度，负值往左） */
  biasX?: number;
}

/** Uniform scale — width fit by default; contain when parent height is bounded. */
export default function FigmaScaledCanvas({
  designWidth,
  designHeight,
  children,
  className = '',
  fillHeight = false,
  scaleBoost = 1,
  fillAxis = 'contain',
  biasX = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const resize = () => {
      const w = el.clientWidth;
      if (w <= 0) return;

      const h = el.clientHeight;
      const widthScale = w / designWidth;
      const heightScale = h / designHeight;

      let scale: number;
      if (fillAxis === 'height') {
        scale = heightScale * scaleBoost;
      } else if (fillAxis === 'width') {
        scale = widthScale * scaleBoost;
      } else if (h <= 0) {
        scale = widthScale * scaleBoost;
      } else {
        const containScale = Math.min(widthScale, heightScale);
        scale = containScale * scaleBoost;
        // 始终限制在容器内，避免溢出
        scale = Math.min(scale, widthScale, heightScale);
      }

      if (h <= 0) {
        const scaledH = designHeight * scale;
        inner.style.transform = `scale(${scale})`;
        inner.style.visibility = 'visible';
        inner.style.left = `${biasX * w}px`;
        inner.style.top = '0';
        el.style.height = `${scaledH}px`;
        return;
      }

      const scaledW = designWidth * scale;
      const scaledH = designHeight * scale;

      inner.style.transform = `scale(${scale})`;
      inner.style.visibility = 'visible';

      const left = (w - scaledW) / 2 + biasX * w;
      const top = Math.max(0, (h - scaledH) / 2);

      inner.style.left = `${left}px`;
      inner.style.top = `${top}px`;
      el.style.height = '100%';
    };

    resize();
    requestAnimationFrame(resize);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener('resize', resize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [designWidth, designHeight, fillHeight, scaleBoost, fillAxis, biasX]);

  return (
    <div
      ref={containerRef}
      className={`figma-scaled-canvas${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: designWidth,
          height: designHeight,
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: 'scale(1)',
          visibility: 'hidden',
          display: 'block',
          overflow: 'visible',
        }}
      >
        {children}
      </div>
    </div>
  );
}
