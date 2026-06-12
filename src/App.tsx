import { useEffect, useRef, useState, useCallback } from 'react';
import { useData } from './hooks/useData';
import LoadingScreen from './components/LoadingScreen';
import PageTitle from './components/PageTitle';
import OverviewPage from './components/OverviewPage';
import RegionalPage from './components/RegionalPage';
import SafetyPage from './components/SafetyPage';
import FacilityPage from './components/FacilityPage';
import FacultyPage from './components/FacultyPage';

export type PageId = 'overview' | 'regional' | 'safety' | 'facility' | 'faculty';

export default function App() {
  const { data, loading, error } = useData();
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [showLoading, setShowLoading] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.scrollTop = 0;
    requestAnimationFrame(() => {
      el.scrollTop = 0;
    });
  }, [activePage]);

  useEffect(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }, [activePage]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-page">
        <div className="card p-8 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-accent-red text-lg font-semibold mb-2">数据加载失败</p>
          <p className="text-text-secondary text-sm mb-4">{error || '未知错误'}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-accent-purple text-white text-sm font-medium hover:opacity-90 transition cursor-pointer">
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  if (!data && !loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-page">
        <p className="text-text-secondary text-sm">正在初始化...</p>
      </div>
    );
  }

  if (loading || !data) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (showLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'regional': return <RegionalPage data={data} />;
      case 'safety': return <SafetyPage data={data} />;
      case 'facility': return <FacilityPage data={data} />;
      case 'faculty': return <FacultyPage data={data} />;
      default: return null;
    }
  };

  return (
    <div className="h-svh flex flex-col bg-bg-page">
      <PageTitle activePage={activePage} onPageChange={setActivePage} />
      <main
        ref={mainRef}
        className={`page-content${activePage === 'overview' ? ' page-content--overview' : ' page-content--tab'}`}
      >
        <div className={activePage === 'overview' ? 'contents' : 'hidden'} aria-hidden={activePage !== 'overview'}>
          <OverviewPage data={data} scrollContainerRef={mainRef} />
        </div>
        {renderPage()}
      </main>
      <footer className="app-footer">
        义务教育标准化学校监测数据可视化看板 · 2026年温州市第二届教育数据可视化技能大赛
      </footer>
    </div>
  );
}
