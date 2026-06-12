import type { PageId } from '../App';

const pages: { id: PageId; label: string; icon: string }[] = [
  { id: 'overview', label: '总览', icon: '📊' },
  { id: 'regional', label: '区域', icon: '🌍' },
  { id: 'safety', label: '安全', icon: '🛡️' },
  { id: 'facility', label: '设施', icon: '🏗️' },
  { id: 'faculty', label: '师资', icon: '👩‍🏫' },
];

export default function Sidebar({ activePage, onPageChange }: {
  activePage: PageId;
  onPageChange: (p: PageId) => void;
}) {
  return (
    <nav className="sidebar">
      {pages.map(p => (
        <button
          key={p.id}
          className={`sidebar-item ${activePage === p.id ? 'active' : ''}`}
          onClick={() => onPageChange(p.id)}
          title={p.label}
        >
          {p.icon}
        </button>
      ))}
    </nav>
  );
}
