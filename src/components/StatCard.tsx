import type { ReactNode } from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  suffix?: string;
  change?: { value: string; up: boolean };
  color?: string;
  className?: string;
}

export default function StatCard({ icon, label, value, suffix = '', change, color = '#8676FF', className = '' }: StatCardProps) {
  return (
    <div className={`stat-card animate-fade-in-up ${className}`}>
      <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value font-number">
          {value}{suffix && <span className="text-sm font-normal text-text-secondary ml-0.5">{suffix}</span>}
        </div>
        {change && (
          <div className={`stat-card-change ${change.up ? 'up' : 'down'}`}>
            {change.up ? '↑' : '↓'} {change.value}
          </div>
        )}
      </div>
    </div>
  );
}
