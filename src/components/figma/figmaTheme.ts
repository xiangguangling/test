import type { CSSProperties } from 'react';

/** Figma「浅色」design tokens for chart styling */
export const FIGMA = {
  textPrimary: '#383874',
  textSecondary: '#9292C1',
  textDark: '#171725',
  textMuted: '#44444F',
  gridLine: '#F1F1F5',
  bgCard: '#FFFFFF',
  purple: '#8676FF',
  pink: '#FF708B',
  cyan: '#66C8FF',
  green: '#00B929',
  orange: '#FFBA69',
  red: '#FF2D2E',
  blue: '#023AFF',
  yellow: '#FAE634',
  legendPurple: '#A46CE9',
  legendYellow: '#FAE634',
  legendPink: '#FC717D',
  legendIndigo: '#695DFB',
  cardShadow: 'drop-shadow(rgba(108, 73, 172, 0.02) 0px 2.76726px 2.21381px) drop-shadow(rgba(108, 73, 172, 0.027) 0px 6.6501px 5.32008px) drop-shadow(rgba(108, 73, 172, 0.035) 0px 12.5216px 10.0172px)',
  /** Figma 雷达图同心圆叠层阴影 */
  radarDiscShadow: [
    '0 3.035px 2.428px rgba(108, 73, 172, 0.02)',
    '0 7.295px 5.836px rgba(108, 73, 172, 0.027)',
    '0 13.735px 10.988px rgba(108, 73, 172, 0.035)',
    '0 24.501px 19.601px rgba(108, 73, 172, 0.043)',
    '0 45.826px 36.661px rgba(108, 73, 172, 0.05)',
    '0 109.69px 87.752px rgba(108, 73, 172, 0.07)',
  ].join(', '),
} as const;

/** Figma RoseChart.html 同心圆尺寸（px）由外到内 */
export const FIGMA_RADAR_DISCS = [593, 520, 383, 223] as const;
/** 数据层半径 = 最外圈圆半径，使 max=1 的顶点贴外圆 */
export const FIGMA_RADAR_RADIUS = FIGMA_RADAR_DISCS[0] / 2;

export const FIGMA_CARD_STYLE: CSSProperties = {
  background: FIGMA.bgCard,
  borderRadius: 20,
  overflow: 'hidden',
  filter: FIGMA.cardShadow,
  width: '100%',
  height: '100%',
  position: 'relative',
};

export const SCHOOL_TYPES = ['小学', '初中', '九年制'] as const;
export const SCHOOL_TYPE_COLORS = [FIGMA.purple, FIGMA.pink, FIGMA.cyan];
