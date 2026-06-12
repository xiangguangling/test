import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(import.meta.dirname, '..', 'src', 'components');

function restoreFromGit(file) {
  const buf = execSync(`git show HEAD:src/components/${file}`);
  fs.writeFileSync(path.join(root, file), buf);
}

restoreFromGit('SankeyPassFlow.tsx');
restoreFromGit('CrisisAlert.tsx');

const overviewFiles = [
  'CrisisAlert.tsx',
  'IndicatorRadar.tsx',
  'UrbanRuralHeatmap.tsx',
  'WeaknessBars.tsx',
  'SchoolTypeComparison.tsx',
  'ScoreDistribution.tsx',
  'BottomSchoolsList.tsx',
  'IndicatorSunburst.tsx',
  'OverviewCards.tsx',
  'SankeyPassFlow.tsx',
];

for (const file of overviewFiles) {
  const fp = path.join(root, file);
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(
    "import { useInView } from '../hooks/useInView';",
    "import { useOverviewInView } from '../hooks/useOverviewInView';",
  );
  s = s.replace('useInView({ threshold: 0.2 })', 'useOverviewInView()');

  if (file !== 'OverviewCards.tsx') {
    if (!s.includes("from '../utils/chartResize'")) {
      if (s.includes("import { useOverviewInView } from '../hooks/useOverviewInView';")) {
        s = s.replace(
          "import { useOverviewInView } from '../hooks/useOverviewInView';",
          "import { useOverviewInView } from '../hooks/useOverviewInView';\nimport { mountEcharts } from '../utils/chartResize';",
        );
      } else if (s.includes("import { useInView } from '../hooks/useInView';")) {
        s = s.replace(
          "import { useInView } from '../hooks/useInView';",
          "import { useInView } from '../hooks/useInView';\nimport { mountEcharts } from '../utils/chartResize';",
        );
      }
    } else if (!s.includes('mountEcharts') && s.includes("import { observeChartResize } from '../utils/chartResize';")) {
      s = s.replace(
        "import { observeChartResize } from '../utils/chartResize';",
        "import { mountEcharts, observeChartResize } from '../utils/chartResize';",
      );
    }
    s = s.replace(
      /const chart = echarts\.init\(chartRef\.current, 'dark'\);\r?\n\r?\n/,
      '',
    );
    s = s.replace(
      /    chart\.setOption\(option\);\r?\n/,
      '    const chart = mountEcharts(chartRef.current, option);\n',
    );
    s = s.replace(
      /const gaugeChart = echarts\.init\(gaugeRef\.current, 'dark'\);\r?\n    gaugeChart\.setOption\(/,
      'const gaugeChart = mountEcharts(gaugeRef.current, ',
    );
    s = s.replace(
      /const pieChart = echarts\.init\(pieRef\.current, 'dark'\);\r?\n    pieChart\.setOption\(/,
      'const pieChart = mountEcharts(pieRef.current, ',
    );
  }

  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated', file);
}

const gridFiles = ['FacultyGrid.tsx', 'RegionalGrid.tsx', 'FacilityGrid.tsx', 'SafetyGrid.tsx'];
for (const file of gridFiles) {
  const fp = path.join(root, file);
  let s = fs.readFileSync(fp, 'utf8');

  if (!s.includes("from '../hooks/useEcharts'")) {
    s = s.replace(
      "import { observeChartResize } from '../utils/chartResize';",
      "import { observeChartResize } from '../utils/chartResize';\nimport { useEcharts } from '../hooks/useEcharts';",
    );
    s = s.replace(
      /function useChart\(ref: React\.RefObject<HTMLDivElement \| null>, opt: echarts\.EChartsCoreOption\) \{[\s\S]*?\}\r?\n\r?\n/,
      '',
    );
    s = s.replace(/useChart\(/g, 'useEcharts(');
  }

  s = s.replace(
    /function Cell\(\{ t, i, c, p, children \}: \{ t: string; i: string; c: string; p\?: string; children: React\.ReactNode \}\)/,
    'function Cell({ t, i, c, p, appearClass, children }: { t: string; i: string; c: string; p?: string; appearClass?: string; children: React.ReactNode })',
  );
  s = s.replace(
    '<div className="card-border chart-panel p-3 flex flex-col relative h-full" style={{ minHeight: 0 }}>',
    '<div className={`card-border chart-panel p-3 flex flex-col relative h-full${appearClass ? ` ${appearClass}` : ""}`} style={{ minHeight: 0 }}>',
  );
  s = s.replace(
    /<div ref=\{item\.r\} className=\{`chart-embed-canvas chart-appear \$\{item\.delay\}`\} \/>/g,
    '<div ref={item.r} className="chart-embed-canvas" />',
  );
  s = s.replace(
    /<Cell t=\{item\.t\} i=\{item\.i\} c=\{item\.c\}>/g,
    '<Cell t={item.t} i={item.i} c={item.c} appearClass={`chart-appear ${item.delay}`}>',
  );

  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated grid', file);
}
