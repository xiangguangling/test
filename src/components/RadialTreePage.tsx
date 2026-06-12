import type { DashboardData } from '../types';
import RadialTreeViz from './RadialTreeViz';

export default function RadialTreePage({ data }: { data: DashboardData }) {
  return (
    <div className="radial-tree-page">
      <RadialTreeViz data={data} fullscreen />
    </div>
  );
}
