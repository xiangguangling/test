import { useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardData } from '../types';
import { buildIndicatorTree } from '../utils/buildIndicatorTree';
import ChartCard from './ChartCard';
import FigmaScaledCanvas from './figma/FigmaScaledCanvas';
import { useOverviewInView } from '../hooks/useOverviewInView';

const EXPAND_MS = 1400;

interface Pos { x: number; y: number; angle: number }

interface RadialConfig {
  scale: number;
  W: number;
  H: number;
  CX: number;
  CY: number;
  R_CAT: number;
  R_SUB: number;
  R_LEAF: number;
  R_LABEL: number;
  fillHeight: boolean;
  scaleBoost: number;
  leafFont: number;
  leafR: number;
  labelDx: number;
  nameMax: number;
  subR: number;
  subIdFont: number;
  subPctFont: number;
  catR: number;
  catLabelFont: number;
  catPctFont: number;
  catCountFont: number;
  centerR: number;
  centerTagFont: number;
  centerPctFont: number;
  centerSubFont: number;
  linkCatWidth: number;
  legendFont: number;
  leafPctFont: number;
  horizontalLabels: boolean;
}

type RadialMode = 'default' | 'fullscreen' | 'overview';

function buildConfig(mode: RadialMode): RadialConfig {
  if (mode === 'overview') {
    const scale = 0.86;
    const W = 920;
    const H = 740;
    const CX = W / 2;
    const CY = H / 2;
    const R_LEAF = 268 * scale;
    return {
      scale,
      W,
      H,
      CX,
      CY,
      R_CAT: 110 * scale * 0.95,
      R_SUB: 210 * scale * 0.95,
      R_LEAF,
      R_LABEL: R_LEAF + 36,
      fillHeight: true,
      scaleBoost: 1.08,
      leafFont: 10.5,
      leafPctFont: 9.5,
      leafR: 7,
      labelDx: 8,
      nameMax: 10,
      subR: 22,
      subIdFont: 10,
      subPctFont: 11,
      catR: 40,
      catLabelFont: 12,
      catPctFont: 16,
      catCountFont: 9,
      centerR: 62,
      centerTagFont: 11,
      centerPctFont: 26,
      centerSubFont: 10,
      linkCatWidth: 14,
      legendFont: 12,
      horizontalLabels: true,
    };
  }

  const fullscreen = mode === 'fullscreen';
  const scale = fullscreen ? 0.86 : 0.82;
  const W = fullscreen ? 920 : 935;
  const H = fullscreen ? 740 : 770;
  const CX = W / 2;
  const CY = H / 2;
  const R_LEAF = (fullscreen ? 268 : 300) * scale;
  return {
    scale,
    W,
    H,
    CX,
    CY,
    R_CAT: 110 * scale * (fullscreen ? 0.95 : 1),
    R_SUB: 210 * scale * (fullscreen ? 0.95 : 1),
    R_LEAF,
    R_LABEL: R_LEAF + (fullscreen ? 36 : 26),
    fillHeight: fullscreen,
    scaleBoost: fullscreen ? 0.84 : 0.92,
    leafFont: fullscreen ? 10.5 : 7.5,
    leafPctFont: fullscreen ? 9.5 : 7,
    leafR: fullscreen ? 7 : 7,
    labelDx: fullscreen ? 8 : 9,
    nameMax: fullscreen ? 10 : 8,
    subR: fullscreen ? 22 : 20,
    subIdFont: fullscreen ? 10 : 8,
    subPctFont: fullscreen ? 11 : 9,
    catR: fullscreen ? 40 : 38,
    catLabelFont: fullscreen ? 12 : 11,
    catPctFont: fullscreen ? 16 : 15,
    catCountFont: fullscreen ? 9 : 8,
    centerR: fullscreen ? 62 : 64,
    centerTagFont: fullscreen ? 11 : 10,
    centerPctFont: fullscreen ? 26 : 24,
    centerSubFont: fullscreen ? 10 : 9,
    linkCatWidth: fullscreen ? 14 : 14,
    legendFont: fullscreen ? 12 : 11,
    horizontalLabels: fullscreen,
  };
}

function polar(cx: number, cy: number, r: number, deg: number): Pos {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), angle: deg };
}

function curvePath(x1: number, y1: number, x2: number, y2: number, bend = 0.35) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cpx = mx - dy * bend;
  const cpy = my + dx * bend;
  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function rateColor(rate: number) {
  if (rate >= 0.95) return '#00B929';
  if (rate >= 0.85) return '#8676FF';
  if (rate >= 0.75) return '#FFBA69';
  return '#FF2D2E';
}

function pct(rate: number) {
  return `${(rate * 100).toFixed(rate < 0.1 ? 1 : 0)}%`;
}

function pctLeaf(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

function shortLeafName(name: string, max: number) {
  const n = name.replace(/得分率/g, '').trim();
  return n.length > max ? `${n.slice(0, max)}…` : n;
}

function nodeProgress(expand: number, pos: Pos, cfg: RadialConfig) {
  const dist = Math.hypot(pos.x - cfg.CX, pos.y - cfg.CY);
  const delay = (dist / cfg.R_LEAF) * 0.38;
  const t = Math.max(0, Math.min(1, (expand - delay) / (1 - delay)));
  return easeOutCubic(t);
}

function animPos(pos: Pos, expand: number, floatT: number, phase: number, cfg: RadialConfig) {
  const p = nodeProgress(expand, pos, cfg);
  const x = cfg.CX + (pos.x - cfg.CX) * p;
  const y = cfg.CY + (pos.y - cfg.CY) * p;
  if (expand < 1) return { x, y, p };
  const amp = cfg.horizontalLabels ? 1.2 : 2;
  const fx = Math.sin(floatT * 0.0012 + phase) * amp;
  const fy = Math.cos(floatT * 0.0015 + phase) * (amp + 0.3);
  return { x: x + fx, y: y + fy, p: 1 };
}

function leafLabelTransform(angle: number, dx: number) {
  const a = ((angle % 360) + 360) % 360;
  if (a > 90 && a < 270) {
    return { rotate: angle + 180, anchor: 'end' as const, dx: -dx };
  }
  return { rotate: angle, anchor: 'start' as const, dx };
}

function horizontalLabelFromLeaf(
  x: number, y: number, angle: number, cfg: RadialConfig, stagger: boolean,
) {
  const a = ((angle % 360) + 360) % 360;
  const rad = (angle * Math.PI) / 180;
  const dist = cfg.leafR + cfg.labelDx + (stagger ? 10 : 0);
  const lx = x + Math.cos(rad) * dist;
  const ly = y + Math.sin(rad) * dist;
  let anchor: 'start' | 'end' | 'middle' = 'start';
  if (a > 65 && a < 115) anchor = 'middle';
  else if (a > 115 && a < 245) anchor = 'end';
  return { lx, ly, anchor };
}

function useRadialTreeMotion(shouldPlay: boolean) {
  const [expand, setExpand] = useState(0);
  const [floatT, setFloatT] = useState(0);
  const playToken = useRef(0);

  useEffect(() => {
    if (!shouldPlay) {
      setExpand(0);
      return;
    }

    playToken.current += 1;
    const token = playToken.current;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (playToken.current !== token) return;
      setExpand(Math.min(1, (now - start) / EXPAND_MS));
      setFloatT(now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldPlay]);

  return { expand, floatT };
}

export default function RadialTreeViz({
  data,
  className = '',
  fullscreen = false,
  overview = false,
}: {
  data: DashboardData;
  className?: string;
  fullscreen?: boolean;
  overview?: boolean;
}) {
  const mode: RadialMode = overview ? 'overview' : fullscreen ? 'fullscreen' : 'default';
  const cfg = useMemo(() => buildConfig(mode), [mode]);
  const tree = useMemo(() => buildIndicatorTree(data), [data]);
  const { ref: inViewRef, inView } = useOverviewInView({ triggerOnce: false });
  const shouldAnimate = overview ? inView : true;
  const { expand, floatT } = useRadialTreeMotion(shouldAnimate);
  const isWideLayout = mode !== 'default';

  const layout = useMemo(() => {
    const catAngles = [-125, -5, 115];
    const sector = 108;

    return tree.categories.map((cat, ci) => {
      const catPos = polar(cfg.CX, cfg.CY, cfg.R_CAT, catAngles[ci]);
      const subCount = cat.subgroups.length;
      const start = catAngles[ci] - sector / 2;
      const step = subCount > 1 ? sector / (subCount - 1) : 0;

      const subgroups = cat.subgroups.map((sub, si) => {
        const angle = subCount === 1 ? catAngles[ci] : start + step * si;
        const subPos = polar(cfg.CX, cfg.CY, cfg.R_SUB, angle);
        const leafCount = sub.leaves.length;
        const spread = Math.min(isWideLayout ? 50 : 48, Math.max(10, leafCount * (isWideLayout ? 3.4 : 3.2)));
        const leafStart = angle - spread / 2;
        const leafStep = leafCount > 1 ? spread / (leafCount - 1) : 0;

        const leaves = sub.leaves.map((leaf, li) => {
          const leafAngle = leafCount === 1 ? angle : leafStart + leafStep * li;
          const pos = polar(cfg.CX, cfg.CY, cfg.R_LEAF, leafAngle);
          const labelPos = polar(cfg.CX, cfg.CY, cfg.R_LABEL, leafAngle);
          return { ...leaf, pos, labelPos };
        });

        return { ...sub, pos: subPos, leaves, phase: si * 1.7 + ci * 2.3 };
      });

      return { ...cat, pos: catPos, subgroups, phase: ci * 2.1 };
    });
  }, [tree, cfg, isWideLayout]);

  const rootPct = pct(tree.root.rate);
  const centerP = easeOutCubic(Math.min(1, expand * 2.5));

  return (
    <div ref={overview ? inViewRef : undefined} className="radial-tree-viz-root h-full">
      <ChartCard
        title="44项指标层级结构"
        className={`${className}${isWideLayout ? ' radial-tree-viz--fullscreen' : ''}${overview ? ' radial-tree-viz--overview' : ''}`.trim()}
      >
      <FigmaScaledCanvas
        designWidth={cfg.W}
        designHeight={cfg.H}
        fillHeight={cfg.fillHeight}
        scaleBoost={cfg.scaleBoost}
      >
        <div style={{ width: cfg.W, height: cfg.H, position: 'relative' }}>
          <svg width={cfg.W} height={cfg.H} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              {layout.map(cat => (
                <linearGradient key={`g-${cat.id}`} id={`grad-cat-${cat.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={cat.gradient[0]} />
                  <stop offset="100%" stopColor={cat.gradient[1]} />
                </linearGradient>
              ))}
              <linearGradient id="grad-center" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F77593" />
                <stop offset="100%" stopColor="#895BED" />
              </linearGradient>
            </defs>

            {Array.from({ length: 60 }).map((_, i) => {
              const a = (i / 60) * 360 - 90;
              const p1 = polar(cfg.CX, cfg.CY, 42 * cfg.scale, a);
              const p2 = polar(cfg.CX, cfg.CY, (i % 5 === 0 ? 50 : 46) * cfg.scale, a);
              return (
                <line
                  key={`tick-${i}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="#DBDFF1" strokeWidth={i % 5 === 0 ? 1.2 : 0.6}
                  opacity={centerP}
                />
              );
            })}

            {layout.map(cat => {
              const catAnim = animPos(cat.pos, expand, floatT, cat.phase, cfg);
              return (
                <g key={`links-${cat.id}`} opacity={catAnim.p}>
                  <path
                    d={curvePath(cfg.CX, cfg.CY, catAnim.x, catAnim.y, 0.2)}
                    fill="none" stroke={`url(#grad-cat-${cat.id})`} strokeWidth={cfg.linkCatWidth}
                    strokeOpacity={0.25} strokeLinecap="round"
                  />
                  {cat.subgroups.map(sub => {
                    const subAnim = animPos(sub.pos, expand, floatT, sub.phase, cfg);
                    return (
                      <g key={`sub-links-${sub.id}`}>
                        <path
                          d={curvePath(catAnim.x, catAnim.y, subAnim.x, subAnim.y, 0.25)}
                          fill="none" stroke={cat.color} strokeWidth={isWideLayout ? 3 : 2.5}
                          strokeOpacity={0.35 * subAnim.p} strokeLinecap="round"
                        />
                        {sub.leaves.map((leaf, li) => {
                          const leafAnim = animPos(leaf.pos, expand, floatT, sub.phase + li * 0.4, cfg);
                          return (
                            <path
                              key={`leaf-link-${leaf.id}`}
                              d={curvePath(subAnim.x, subAnim.y, leafAnim.x, leafAnim.y, 0.15)}
                              fill="none" stroke={rateColor(leaf.rate)} strokeWidth={isWideLayout ? 1.5 : 1.2}
                              strokeOpacity={0.4 * leafAnim.p} strokeLinecap="round"
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {layout.flatMap(cat =>
              cat.subgroups.flatMap(sub =>
                sub.leaves.map((leaf, li) => {
                  const { x, y, p } = animPos(leaf.pos, expand, floatT, sub.phase + li * 0.55, cfg);
                  const name = shortLeafName(leaf.name, cfg.nameMax);
                  const labelOpacity = Math.max(0, (p - 0.4) / 0.6);
                  return (
                    <g key={leaf.id} opacity={p}>
                      <g transform={`translate(${x},${y}) scale(${0.35 + 0.65 * p})`}>
                        <circle r={cfg.leafR} fill={rateColor(leaf.rate)} opacity={0.92}
                          style={{ filter: 'drop-shadow(0 1px 3px rgba(255,45,46,0.2))' }} />
                        <title>{`${leaf.name}: ${pctLeaf(leaf.rate)}`}</title>
                      </g>
                      {cfg.horizontalLabels ? (() => {
                        const { lx, ly, anchor } = horizontalLabelFromLeaf(
                          x, y, leaf.pos.angle, cfg, li % 2 === 1,
                        );
                        return (
                          <text
                            x={lx} y={ly}
                            textAnchor={anchor}
                            fontFamily="Roboto, sans-serif"
                            opacity={labelOpacity}
                          >
                            <tspan
                              x={lx} dy={-2}
                              fontSize={cfg.leafFont}
                              fontWeight={600}
                              fill="#383874"
                              stroke="#fff"
                              strokeWidth={4}
                              paintOrder="stroke"
                            >
                              {name}
                            </tspan>
                            <tspan
                              x={lx} dy={12}
                              fontSize={cfg.leafPctFont}
                              fontWeight={700}
                              fill={rateColor(leaf.rate)}
                              stroke="#fff"
                              strokeWidth={3}
                              paintOrder="stroke"
                            >
                              {pctLeaf(leaf.rate)}
                            </tspan>
                          </text>
                        );
                      })() : (() => {
                        const labelAnim = animPos(leaf.labelPos, expand, floatT, sub.phase + li * 0.55, cfg);
                        const label = leafLabelTransform(leaf.pos.angle, cfg.labelDx);
                        const labelText = `${name} [${pctLeaf(leaf.rate)}]`;
                        return (
                          <text
                            x={labelAnim.x} y={labelAnim.y}
                            textAnchor={label.anchor}
                            fontSize={cfg.leafFont} fontWeight={500}
                            fill={rateColor(leaf.rate)}
                            fontFamily="Roboto, sans-serif"
                            transform={`rotate(${label.rotate}, ${labelAnim.x}, ${labelAnim.y})`}
                            opacity={labelOpacity}
                          >
                            <tspan dx={label.dx} dy={3}>{labelText}</tspan>
                          </text>
                        );
                      })()}
                    </g>
                  );
                })
              )
            )}

            {layout.flatMap(cat =>
              cat.subgroups.map(sub => {
                const { x, y, p } = animPos(sub.pos, expand, floatT, sub.phase, cfg);
                return (
                  <g key={sub.id} transform={`translate(${x},${y}) scale(${0.4 + 0.6 * p})`} opacity={p}>
                    <circle r={cfg.subR} fill="#fff" stroke={cat.color} strokeWidth={isWideLayout ? 2.5 : 2}
                      style={{ filter: 'drop-shadow(0 3px 10px rgba(108,73,172,0.12))' }} />
                    <text y={-4} textAnchor="middle" fontSize={cfg.subIdFont} fontWeight={600}
                      fill="#383874" fontFamily="Poppins, sans-serif">{sub.id}</text>
                    <text y={10} textAnchor="middle" fontSize={cfg.subPctFont} fontWeight={700}
                      fill={rateColor(sub.rate)} fontFamily="Open Sans, sans-serif">
                      {pct(sub.rate)}
                    </text>
                    <title>{`${sub.label} (${sub.count}项): ${pct(sub.rate)}`}</title>
                  </g>
                );
              })
            )}

            {layout.map(cat => {
              const { x, y, p } = animPos(cat.pos, expand, floatT, cat.phase, cfg);
              return (
                <g key={cat.id} transform={`translate(${x},${y}) scale(${0.4 + 0.6 * p})`} opacity={p}>
                  <circle r={cfg.catR} fill={`url(#grad-cat-${cat.id})`}
                    style={{ filter: 'drop-shadow(0 6px 20px rgba(108,73,172,0.18))' }} />
                  <circle r={cfg.catR - 6} fill="rgba(255,255,255,0.12)" />
                  <text y={-10} textAnchor="middle" fontSize={cfg.catLabelFont} fontWeight={500}
                    fill="#fff" fontFamily="Poppins, sans-serif">{cat.shortLabel}</text>
                  <text y={10} textAnchor="middle" fontSize={cfg.catPctFont} fontWeight={700}
                    fill="#fff" fontFamily="Open Sans, sans-serif">{pct(cat.rate)}</text>
                  <text y={26} textAnchor="middle" fontSize={cfg.catCountFont} fontWeight={400}
                    fill="rgba(255,255,255,0.75)" fontFamily="Roboto, sans-serif">{cat.count} 项指标</text>
                  <title>{`${cat.label}: ${pct(cat.rate)}`}</title>
                </g>
              );
            })}

            <g transform={`translate(${cfg.CX},${cfg.CY}) scale(${0.5 + 0.5 * centerP})`} opacity={centerP}>
              <circle r={cfg.centerR} fill="#fff"
                style={{ filter: 'drop-shadow(0 10px 28px rgba(108,73,172,0.15))' }} />
              <circle r={cfg.centerR - 6} fill="none" stroke="url(#grad-center)" strokeWidth={isWideLayout ? 5 : 4} />
              <circle r={cfg.centerR - 16} fill="rgba(246,247,251,0.8)" />
              <text y={-14} textAnchor="middle" fontSize={cfg.centerTagFont} fontWeight={500}
                fill="#9292C1" fontFamily="Poppins, sans-serif" letterSpacing={1}>
                MONITORING
              </text>
              <text y={8} textAnchor="middle" fontSize={cfg.centerPctFont} fontWeight={700}
                fill="#383874" fontFamily="Open Sans, sans-serif">{rootPct}</text>
              <text y={30} textAnchor="middle" fontSize={cfg.centerSubFont} fontWeight={400}
                fill="#9292C1" fontFamily="Roboto, sans-serif">
                {tree.root.label} · {tree.root.totalSchools} 所学校
              </text>
            </g>
          </svg>

          <div style={{
            position: 'absolute', right: 24, bottom: 16, display: 'flex', gap: 16,
            fontSize: cfg.legendFont, color: '#9292C1', fontFamily: 'Roboto, sans-serif',
            opacity: centerP,
          }}>
            {[
              { color: '#8676FF', label: '类别' },
              { color: '#8676FF', label: '子组', ring: true },
              { color: '#FF2D2E', label: '单项' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: item.ring ? '#fff' : item.color,
                  border: item.ring ? `2px solid ${item.color}` : 'none',
                }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
    </div>
  );
}
