import type { DashboardData } from '../types';
import WeaknessBars from './WeaknessBars';
import UrbanRuralHeatmap from './UrbanRuralHeatmap';
import RadialTreeViz from './RadialTreeViz';
import BottomSchoolsList from './BottomSchoolsList';

export default function OverviewBackupSection({ data }: { data: DashboardData }) {
  return (
    <section className="overview-backup-section">
      <div className="overview-backup-grid overview-backup-grid--triple">
        <WeaknessBars data={data} compact />
        <UrbanRuralHeatmap data={data} compact />
        <BottomSchoolsList data={data} compact />
      </div>
      <div className="overview-backup-grid overview-backup-grid--single">
        <RadialTreeViz data={data} overview />
      </div>
    </section>
  );
}
