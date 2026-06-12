import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(import.meta.dirname, '..', 'src', 'components');

function readGit(file) {
  return execSync(`git show HEAD:src/components/${file}`).toString('utf8');
}

function patchStandard(file, glowClass) {
  let s = fs.readFileSync(path.join(root, file), 'utf8');
  if (s.includes('overview-chart-card')) return;

  s = s.replace(
    `className="card-border ${glowClass} p-4 relative"`,
    `className="card-border ${glowClass} p-4 relative overview-chart-card"`,
  );

  s = s.replace(
    /<div ref=\{chartRef\} style=\{\{ width: '100%', height: '[^']+' \}\} \/>/,
    `<div className="overview-chart-body">\n            <div ref={chartRef} className="overview-chart-canvas" />\n          </div>`,
  );

  fs.writeFileSync(path.join(root, file), s, 'utf8');
  console.log('patched', file);
}

// Restore CrisisAlert from git then apply layout + keep prior hook fixes
let crisis = readGit('CrisisAlert.tsx');
crisis = crisis.replace(
  "import { useInView } from '../hooks/useInView';",
  "import { useOverviewInView } from '../hooks/useOverviewInView';\nimport { mountEcharts } from '../utils/chartResize';",
);
crisis = crisis.replace('useInView({ threshold: 0.2 })', 'useOverviewInView()');
crisis = crisis.replace(
  /const gaugeChart = echarts\.init\(gaugeRef\.current, 'dark'\);\r?\n    gaugeChart\.setOption\(/,
  'const gaugeChart = mountEcharts(gaugeRef.current, ',
);
crisis = crisis.replace(
  /const pieChart = echarts\.init\(pieRef\.current, 'dark'\);\r?\n    const totalSchools/,
  'const totalSchools',
);
crisis = crisis.replace(
  /const passSchools = totalSchools - failSchools;\r?\n\r?\n    pieChart\.setOption\(/,
  'const passSchools = totalSchools - failSchools;\n\n    const pieChart = mountEcharts(pieRef.current, ',
);
crisis = crisis.replace(
  'className="card-border glow-red p-4 relative"',
  'className="card-border glow-red p-4 relative overview-chart-card"',
);
crisis = crisis.replace(
  `<div className="grid grid-cols-2 gap-4">
            {/* Gauge */}
            <div>
              <div ref={gaugeRef} style={{ width: '100%', height: '250px' }} />
              <p className="text-xs text-text-muted text-center mt-1 px-1">`,
  `<div className="overview-chart-body">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Gauge */}
            <div className="flex flex-col justify-center min-h-0">
              <div ref={gaugeRef} className="overview-chart-canvas" style={{ minHeight: '200px' }} />
              <p className="text-xs text-text-muted text-center mt-1 px-1 overview-chart-footer">`,
);
crisis = crisis.replace(
  `            {/* Donut + Info */}
            <div className="pr-2">
              <div ref={pieRef} style={{ width: '100%', height: '220px' }} />
              <div className="mt-1 space-y-1.5 pr-1">`,
  `            {/* Donut + Info */}
            <div className="pr-2 flex flex-col justify-center min-h-0">
              <div ref={pieRef} className="overview-chart-canvas" style={{ minHeight: '180px' }} />
              <div className="mt-1 space-y-1.5 pr-1 overview-chart-footer">`,
);
crisis = crisis.replace(
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
fs.writeFileSync(path.join(root, 'CrisisAlert.tsx'), crisis, 'utf8');
console.log('patched CrisisAlert.tsx');

patchStandard('ScoreDistribution.tsx', 'glow-blue');
patchStandard('IndicatorRadar.tsx', 'glow-purple');
patchStandard('WeaknessBars.tsx', 'glow-orange');
patchStandard('SchoolTypeComparison.tsx', 'glow-blue');
patchStandard('SankeyPassFlow.tsx', 'glow-orange');
patchStandard('UrbanRuralHeatmap.tsx', 'glow-cyan');
patchStandard('IndicatorSunburst.tsx', 'glow-purple');
patchStandard('BottomSchoolsList.tsx', 'glow-blue');

// Footers outside chart body
for (const file of [
  'ScoreDistribution.tsx',
  'IndicatorRadar.tsx',
  'SchoolTypeComparison.tsx',
  'SankeyPassFlow.tsx',
  'UrbanRuralHeatmap.tsx',
  'IndicatorSunburst.tsx',
]) {
  let s = fs.readFileSync(path.join(root, file), 'utf8');
  s = s.replace(
    /<p className="text-xs text-text-muted text-center mt-1">/g,
    '<p className="text-xs text-text-muted text-center mt-1 overview-chart-footer">',
  );
  fs.writeFileSync(path.join(root, file), s, 'utf8');
}

// WeaknessBars legend footer
{
  let s = fs.readFileSync(path.join(root, 'WeaknessBars.tsx'), 'utf8');
  s = s.replace(
    '<div className="flex gap-4 mt-2 text-xs text-text-muted justify-center">',
    '<div className="flex gap-4 mt-2 text-xs text-text-muted justify-center overview-chart-footer">',
  );
  fs.writeFileSync(path.join(root, 'WeaknessBars.tsx'), s, 'utf8');
}

// BottomSchoolsList legend
{
  let s = fs.readFileSync(path.join(root, 'BottomSchoolsList.tsx'), 'utf8');
  if (!s.includes('overview-chart-footer')) {
    s = s.replace(
      /<div className="flex gap-3 mt-2 text-xs text-text-muted justify-center">/,
      '<div className="flex gap-3 mt-2 text-xs text-text-muted justify-center overview-chart-footer">',
    );
    fs.writeFileSync(path.join(root, 'BottomSchoolsList.tsx'), s, 'utf8');
  }
}

// Ensure overview hook + mountEcharts on standard charts (from prior fix)
const overviewFiles = [
  'ScoreDistribution.tsx',
  'IndicatorRadar.tsx',
  'WeaknessBars.tsx',
  'SchoolTypeComparison.tsx',
  'SankeyPassFlow.tsx',
  'UrbanRuralHeatmap.tsx',
  'IndicatorSunburst.tsx',
  'BottomSchoolsList.tsx',
];

for (const file of overviewFiles) {
  let s = fs.readFileSync(path.join(root, file), 'utf8');
  if (!s.includes('useOverviewInView')) {
    s = s.replace(
      "import { useInView } from '../hooks/useInView';",
      "import { useOverviewInView } from '../hooks/useOverviewInView';",
    );
    s = s.replace('useInView({ threshold: 0.2 })', 'useOverviewInView()');
  }
  if (!s.includes("from '../utils/chartResize'")) {
    s = s.replace(
      "import { useOverviewInView } from '../hooks/useOverviewInView';",
      "import { useOverviewInView } from '../hooks/useOverviewInView';\nimport { mountEcharts } from '../utils/chartResize';",
    );
  }
  if (s.includes('echarts.init(chartRef.current')) {
    s = s.replace(/const chart = echarts\.init\(chartRef\.current, 'dark'\);\r?\n\r?\n/, '');
    s = s.replace(/    chart\.setOption\(option\);\r?\n/, '    const chart = mountEcharts(chartRef.current, option);\n');
  }
  fs.writeFileSync(path.join(root, file), s, 'utf8');
}

console.log('done');
