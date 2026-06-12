import { useEffect, useRef, useState } from 'react';
import type { DashboardData } from '../types';
import ChartCard from './ChartCard';
import FigmaScaledCanvas from './figma/FigmaScaledCanvas';
import { observeChartViewportToggle } from '../utils/chartResize';
import { getConnectionsFlowInsight } from './ChartInsights';

const DESIGN_W = 1247;
const DESIGN_H = 396;

export default function ConnectionsViz({
  data,
  className = '',
  fillHeight = false,
  hero = false,
}: {
  data: DashboardData;
  className?: string;
  fillHeight?: boolean;
  hero?: boolean;
}) {
  const flowRef = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const flow = flowRef.current;
    if (!flow) return;
    const target = (flow.closest('.overview-chart-cell') ?? flow) as HTMLElement;
    return observeChartViewportToggle(
      target,
      () => setPlay(true),
      () => setPlay(false),
    );
  }, []);

  const types = ['小学', '初中', '九年制'] as const;
  const td = types.map(t => ({
    name: t,
    count: data.by_school_type[t]?.count || 0,
    avg: +(data.by_school_type[t]?.avg_score || 0).toFixed(0),
  }));
  const worst = [...data.indicators].filter(i => i.key !== '得分率').sort((a, b) => a.avg_rate - b.avg_rate).slice(0, 3);

  return (
    <ChartCard
      title="得分率向短板传导"
      className={`${className}${hero ? ' connections-viz--hero' : ''}`.trim()}
      insight={getConnectionsFlowInsight(data)}
    >
      <FigmaScaledCanvas
        designWidth={DESIGN_W}
        designHeight={DESIGN_H}
        fillHeight={hero || fillHeight}
        scaleBoost={hero ? 1.15 : 1}
        biasX={hero ? -0.08 : 0}
      >
        <div
          ref={flowRef}
          className={`connections-flow${play ? ' connections-flow--play' : ''}`}
          style={{
            width: DESIGN_W, height: DESIGN_H, position: 'relative', overflow: 'hidden',
          }}
        >
          {/* ====== SVG Connections (Figma exact) ====== */}
          <div style={{ width: 828, height: 324.5, position: 'absolute', left: 204, top: 37.9453 }}>
            <div className="connections-paths connections-paths--stage1">
            <svg width="304" height="163" viewBox="0 0 304 163" fill="none" style={{ position: 'absolute', left: 0, top: 0 }}>
              <path d="M304 21.0547C111.687 21.0547 191.652 141.555 0 141.555" stroke="url(#cv1)" strokeOpacity="0.7" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv1" x1="242.405" y1="20.6603" x2="172.835" y2="221.948" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F77593"/><stop offset="0.744792" stopColor="#55D6FF"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="303" height="69" viewBox="0 0 303 69" fill="none" style={{ position: 'absolute', left: 1, top: 158 }}>
              <path d="M303 21.0547C162.747 21.0547 201.118 47.5547 0 47.5547" stroke="url(#cv2)" strokeOpacity="0.3" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv2" x1="282" y1="-14.4453" x2="-12.785" y2="-31.1072" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F77695"/><stop offset="0.671875" stopColor="#49D1FF"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="305" height="170" viewBox="0 0 305 170" fill="none" style={{ position: 'absolute', left: 4, top: 154 }}>
              <path d="M-8.10623e-06 21.0547C202.673 21.0547 96.3853 148.055 305 148.055" stroke="url(#cv3)" strokeOpacity="0.5" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv3" x1="79.7562" y1="20.2262" x2="108.887" y2="188.497" gradientUnits="userSpaceOnUse">
                  <stop offset="0.223958" stopColor="#35C8FF"/><stop offset="1" stopColor="#F77594"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
            <div className="connections-paths connections-paths--stage2">
            <svg width="304" height="43" viewBox="0 0 304 43" fill="none" style={{ position: 'absolute', left: 524, top: -24 }}>
              <path d="M304 21.0547C141.382 21.0547 162.059 21.0547 0 21.0547" stroke="url(#cv4)" strokeOpacity="0.5" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv4" x1="248.004" y1="14" x2="-33.2866" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#895BED"/><stop offset="1" stopColor="#E94578"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="304" height="149" viewBox="0 0 304 149" fill="none" style={{ position: 'absolute', left: 524, top: 10.5 }}>
              <path d="M304 21.0547C141.382 21.0547 162.059 127.055 0 127.055" stroke="url(#cv5)" strokeOpacity="0.7" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv5" x1="248.004" y1="128.799" x2="43.3768" y2="254.048" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9265F9"/><stop offset="0.713542" stopColor="#E94578"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="304" height="220" viewBox="0 0 304 220" fill="none" style={{ position: 'absolute', left: 524, top: 123 }}>
              <path d="M304 21.0547C141.382 21.0547 162.059 198.555 0 198.555" stroke="url(#cv6)" strokeOpacity="0.7" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv6" x1="248.004" y1="88.0084" x2="42.3342" y2="212.72" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8D60F3"/><stop offset="0.713542" stopColor="#E94578"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="304" height="181" viewBox="0 0 304 181" fill="none" style={{ position: 'absolute', left: 524, top: 21 }}>
              <path d="M304 159.555C141.382 159.555 162.059 21.0547 0 21.0547" stroke="url(#cv7)" strokeOpacity="0.3" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv7" x1="248.004" y1="56.5889" x2="42.0573" y2="181.156" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8D5FF2"/><stop offset="0.713542" stopColor="#E94578"/>
                </linearGradient>
              </defs>
            </svg>
            <svg width="304" height="79" viewBox="0 0 304 79" fill="none" style={{ position: 'absolute', left: 524, top: 261.5 }}>
              <path d="M304 57.5547C141.382 57.5547 162.059 21.0547 0 21.0547" stroke="url(#cv8)" strokeOpacity="0.3" strokeWidth="42.1095"/>
              <defs>
                <linearGradient id="cv8" x1="257.059" y1="134.582" x2="-248.563" y2="199.339" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8759EA"/><stop offset="0.380839" stopColor="#E94578"/>
                </linearGradient>
              </defs>
            </svg>
            </div>
          </div>

          {/* LEFT: Finance card — blue gradient + crown */}
          <div className="connections-card connections-card--left" style={{
            width: 219, height: 149, position: 'absolute', left: 0, top: 136.5,
            background: 'linear-gradient(rgb(21,134,255) 0%, rgb(54,186,244) 100%)',
            borderRadius: 10, overflow: 'hidden',
            filter: 'drop-shadow(rgba(108,73,172,0.02) 0px 2.76726px 2.21381px) drop-shadow(rgba(108,73,172,0.027) 0px 6.6501px 5.32008px) drop-shadow(rgba(108,73,172,0.035) 0px 12.5216px 10.0172px) drop-shadow(rgba(108,73,172,0.043) 0px 22.3363px 17.869px) drop-shadow(rgba(108,73,172,0.05) 0px 41.7776px 33.4221px) drop-shadow(rgba(108,73,172,0.07) 0px 100px 80px)',
          }}>
            <div style={{ width: 24, height: 24, position: 'absolute', left: 32, top: 20, overflow: 'hidden' }}>
              <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
                <path d="M0 17H20V19H0V17ZM0 3L5 6.5L10 0L15 6.5L20 3V15H0V3ZM2 6.841V13H18V6.841L14.58 9.235L10 3.28L5.42 9.235L2 6.84V6.841Z" fill="black"/>
              </svg>
            </div>
            <div style={{ position: 'absolute', left: 32, top: 83, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <span style={{ fontSize: 20, letterSpacing: 0.15, lineHeight: '32px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#000', whiteSpace: 'break-spaces' }}>综合得分率</span>
              <div style={{ width: 155, opacity: 0.6, marginTop: 0 }}>
                <span style={{ fontSize: 10.6682, letterSpacing: 0.0164126, lineHeight: '13.9507px', fontWeight: 400, fontFamily: 'Mulish, sans-serif', color: '#000', whiteSpace: 'break-spaces' }}>全部855所学校</span>
              </div>
            </div>
          </div>

          {/* MIDDLE: 3 pink gradient cards */}
          {td.map((t, i) => {
            const tops = [0, 143, 286];
            const grads = [
              'linear-gradient(rgb(250,115,139) 0%, rgb(224,142,236) 100%)',
              'linear-gradient(rgb(249,115,141) 0%, rgb(225,140,231) 100%)',
              'linear-gradient(rgb(248,115,142) 0%, rgb(225,139,227) 100%)',
            ];
            return (
              <div key={`m${i}`} className={`connections-card connections-card--mid connections-card--mid-${i}`} style={{
                width: 226, height: 110, position: 'absolute', left: 507, top: tops[i],
                background: grads[i], borderRadius: 10, overflow: 'hidden',
                filter: 'drop-shadow(rgba(255,73,141,0.035) 0px 2.76726px 2.21381px) drop-shadow(rgba(255,73,141,0.05) 0px 6.6501px 5.32008px) drop-shadow(rgba(255,73,141,0.067) 0px 12.5216px 10.0172px) drop-shadow(rgba(255,73,141,0.08) 0px 22.3363px 17.869px) drop-shadow(rgba(255,73,141,0.094) 0px 41.7776px 33.4221px) drop-shadow(rgba(255,73,141,0.13) 0px 100px 80px)',
              }}>
                <div style={{ position: 'absolute', left: 32, top: 20 }}>
                  <span style={{ fontSize: 16, letterSpacing: 0.44, lineHeight: '24px', fontWeight: 300, fontFamily: 'Poppins, sans-serif', color: '#fff' }}>{t.name}</span>
                </div>
                <div style={{ position: 'absolute', left: 32, top: 44 }}>
                  <span style={{ fontSize: 20, letterSpacing: 0.15, lineHeight: '32px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#fff' }}>{t.avg}<span style={{ fontWeight: 300, fontSize: 14, opacity: 0.7 }}> 分</span></span>
                </div>
                <div style={{ position: 'absolute', left: 32, top: 76, width: 162, opacity: 0.6 }}>
                  <span style={{ fontSize: 10.6682, letterSpacing: 0.0164126, lineHeight: '13.9507px', fontWeight: 400, fontFamily: 'Mulish, sans-serif', color: '#fff' }}>{t.count} 所学校</span>
                </div>
              </div>
            );
          })}

          {/* RIGHT: 3 purple-blue gradient cards */}
          {worst.map((ind, i) => {
            const tops = [0, 143, 286];
            return (
              <div key={`r${i}`} className={`connections-card connections-card--right connections-card--right-${i}`} style={{
                width: 226, height: 110, position: 'absolute', left: 1021, top: tops[i],
                background: i === 0
                  ? 'linear-gradient(rgb(166,69,211) 0%, rgb(38,73,255) 100%)'
                  : 'linear-gradient(rgb(165,68,211) 0%, rgb(47,72,252) 100%)',
                borderRadius: 10, overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 32, top: 20 }}>
                  <span style={{ fontSize: 16, letterSpacing: 0.44, lineHeight: '24px', fontWeight: 300, fontFamily: 'Poppins, sans-serif', color: '#fff' }}>
                    {ind.name.length > 8 ? ind.name.slice(0, 8) + '…' : ind.name}
                  </span>
                </div>
                <div style={{ position: 'absolute', left: 32, top: 44 }}>
                  <span style={{ fontSize: 20, letterSpacing: 0.15, lineHeight: '32px', fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#fff' }}>
                    {(ind.avg_rate * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ position: 'absolute', left: 32, top: 76, width: 162, opacity: 0.6 }}>
                  <span style={{ fontSize: 10.6682, letterSpacing: 0.0164126, lineHeight: '13.9507px', fontWeight: 400, fontFamily: 'Mulish, sans-serif', color: '#fff' }}>
                    {ind.fail_count} 所不达标
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </FigmaScaledCanvas>
    </ChartCard>
  );
}
