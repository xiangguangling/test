import type { PageId } from '../App';

const navPages: { id: PageId; label: string }[] = [
  { id: 'overview', label: '总体概览' },
  { id: 'regional', label: '区域分析' },
  { id: 'safety', label: '安全管理' },
  { id: 'facility', label: '硬件设施' },
  { id: 'faculty', label: '师资队伍' },
];

function NavButton({
  id,
  label,
  activePage,
  onPageChange,
}: {
  id: PageId;
  label: string;
  activePage: PageId;
  onPageChange: (p: PageId) => void;
}) {
  return (
    <button
      type="button"
      className={`topnav-tab page-title-tab ${activePage === id ? 'active' : ''}`}
      onClick={() => onPageChange(id)}
    >
      {label}
    </button>
  );
}

export default function PageTitle({
  activePage,
  onPageChange,
}: {
  activePage: PageId;
  onPageChange: (p: PageId) => void;
}) {
  return (
    <div className="page-title-banner">
      <div className="page-title-inner">
        <div className="page-title-left" aria-hidden />

        <div className="page-title-center">
          <h1 className="page-title-main">义务教育标准化学校监测</h1>
          <div className="page-title-sub-wrap">
            <span className="page-title-line page-title-line-left" aria-hidden />
            <h2 className="page-title-sub">数据可视化看板</h2>
            <span className="page-title-line page-title-line-right" aria-hidden />
          </div>
        </div>

        <div className="page-title-right">
          <nav className="page-title-nav" aria-label="页面导航">
            {navPages.map(p => (
              <NavButton
                key={p.id}
                id={p.id}
                label={p.label}
                activePage={activePage}
                onPageChange={onPageChange}
              />
            ))}
          </nav>
          <div className="page-title-badge">
            <span className="page-title-badge-dot" />
            温州市 · 2026
          </div>
        </div>
      </div>
    </div>
  );
}
