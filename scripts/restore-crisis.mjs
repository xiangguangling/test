import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const fp = path.resolve(import.meta.dirname, '..', 'src', 'components', 'CrisisAlert.tsx');
const buf = execSync('git show HEAD:src/components/CrisisAlert.tsx');
let s = buf.toString('utf8');

s = s.replace(
  "import { useInView } from '../hooks/useInView';",
  "import { useOverviewInView } from '../hooks/useOverviewInView';\nimport { mountEcharts } from '../utils/chartResize';\nimport { buildSideLegend, sideLegendPieLayout } from '../utils/chartLegend';",
);
s = s.replace('useInView({ threshold: 0.2 })', 'useOverviewInView()');

s = s.replace(
  /const gaugeChart = echarts\.init\(gaugeRef\.current, 'dark'\);\r?\n    gaugeChart\.setOption\(/,
  'const gaugeChart = mountEcharts(gaugeRef.current, ',
);

s = s.replace(
  /const pieChart = echarts\.init\(pieRef\.current, 'dark'\);\r?\n    const totalSchools/,
  'const totalSchools',
);
s = s.replace(
  /const passSchools = totalSchools - failSchools;\r?\n\r?\n    pieChart\.setOption\(/,
  'const passSchools = totalSchools - failSchools;\n\n    const pieChart = mountEcharts(pieRef.current, ',
);

// gauge larger
s = s.replace("center: ['50%', '62%'],\n          radius: '92%'", "center: ['50%', '58%'],\n          radius: '100%'");

// pie legend + size
s = s.replace(
  /legend: \{\r?\n        bottom: 0,\r?\n        textStyle: \{ color: '#9aa0b0', fontSize: 11 \},\r?\n      \},\r?\n      series: \[\r?\n        \{\r?\n          type: 'pie',\r?\n          radius: \['55%', '78%'\],\r?\n          center: \['50%', '48%'\],/,
  "legend: buildSideLegend(['达标学校', '不达标学校'], { fontSize: 10 }),\n      series: [\n        {\n          type: 'pie',\n          radius: sideLegendPieLayout.radius,\n          center: sideLegendPieLayout.center,",
);

// overview layout classes
s = s.replace(
  'className="card-border glow-red p-4 relative"',
  'className="card-border glow-red p-4 relative overview-chart-card"',
);
s = s.replace(
  `<div className="grid grid-cols-2 gap-4">
            {/* Gauge */}
            <div>
              <div ref={gaugeRef} style={{ width: '100%', height: '250px' }} />`,
  `<div className="overview-chart-body">
          <div className="grid grid-cols-2 gap-3 h-full min-h-[280px]">
            <div className="flex flex-col min-h-0">
              <div ref={gaugeRef} className="overview-chart-canvas flex-1" style={{ minHeight: '220px' }} />`,
);
s = s.replace(
  `<p className="text-xs text-text-muted text-center mt-1 px-1">`,
  `<p className="text-xs text-text-muted text-center mt-1 px-1 overview-chart-footer">`,
);
s = s.replace(
  `            {/* Donut + Info */}
            <div className="pr-2">
              <div ref={pieRef} style={{ width: '100%', height: '220px' }} />`,
  `            <div className="flex flex-col min-h-0">
              <div ref={pieRef} className="overview-chart-canvas flex-1" style={{ minHeight: '220px' }} />`,
);
s = s.replace(
  `<div className="mt-1 space-y-1.5 pr-1">`,
  `<div className="mt-1 space-y-1.5 pr-1 overview-chart-footer">`,
);
s = s.replace(
  `            </div>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}`,
  `            </div>
          </div>
          </div>
        </div>
      }
      back={<InsightBack insight={insight} />}`,
);

// LegendComponent for pie
if (!s.includes('LegendComponent')) {
  s = s.replace(
    "import { TooltipComponent } from 'echarts/components';",
    "import { TooltipComponent, LegendComponent } from 'echarts/components';",
  );
  s = s.replace(
    'echarts.use([GaugeChart, PieChart, TooltipComponent, CanvasRenderer]);',
    'echarts.use([GaugeChart, PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);',
  );
}

fs.writeFileSync(fp, s, 'utf8');
console.log('restored CrisisAlert.tsx');
