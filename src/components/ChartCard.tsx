import { type ReactNode } from 'react';
import type { ChartInsight } from './ChartInsights';
import FlipCard from './FlipCard';
import InsightBack from './InsightBack';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  /** 提供洞察数据后，卡片支持点击翻转显示核心发现 */
  insight?: ChartInsight;
}

/** 图表卡片的前面板内容 */
function ChartCardFront({ title, children, className = '', action }: Omit<ChartCardProps, 'insight'>) {
  return (
    <div className={`chart-card animate-fade-in-up ${className}`}>
      <div className="chart-card-header">
        <div className="chart-card-title-wrap">
          <div className="chart-card-title">{title}</div>
        </div>
        {action && <div className="chart-card-action">{action}</div>}
      </div>
      <div className="chart-card-body">
        {children}
      </div>
      <span className="flip-hint" aria-hidden title="点击翻转查看结论">⇄</span>
    </div>
  );
}

export default function ChartCard({ title, children, className = '', action, insight }: ChartCardProps) {
  // 无 insight 时保持原有行为
  if (!insight) {
    return (
      <div className={`chart-card animate-fade-in-up ${className}`}>
        <div className="chart-card-header">
          <div className="chart-card-title-wrap">
            <div className="chart-card-title">{title}</div>
          </div>
          {action && <div className="chart-card-action">{action}</div>}
        </div>
        <div className="chart-card-body">
          {children}
        </div>
      </div>
    );
  }

  // 有 insight 时包裹 FlipCard
  return (
    <FlipCard
      front={<ChartCardFront title={title} className={className} action={action}>{children}</ChartCardFront>}
      back={<InsightBack insight={insight} />}
    />
  );
}
