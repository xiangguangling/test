import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..', 'src', 'components');

const files = [
  'RegionalGrid.tsx',
  'SchoolTypeComparison.tsx',
  'RegionalAnalysis.tsx',
  'SafetyGrid.tsx',
  'FacultyAnalysis.tsx',
  'SafetyAnalysis.tsx',
  'FacilityAnalysis.tsx',
  'IndicatorRadar.tsx',
  'FacultyGrid.tsx',
];

for (const file of files) {
  const fp = path.join(root, file);
  let s = fs.readFileSync(fp, 'utf8');

  if (!s.includes('buildSideLegendGrid')) {
    s = s.replace(
      "import { buildSideLegend, sideLegendGrid, sideLegendRadarCenter } from '../utils/chartLegend';",
      "import { buildSideLegend, buildSideLegendGrid, sideLegendRadarCenter, sideLegendRadarRadius } from '../utils/chartLegend';",
    );
    s = s.replace(
      "import { buildSideLegend, sideLegendGrid } from '../utils/chartLegend';",
      "import { buildSideLegend, buildSideLegendGrid } from '../utils/chartLegend';",
    );
    s = s.replace(
      "import { buildSideLegend, sideLegendRadarCenter } from '../utils/chartLegend';",
      "import { buildSideLegend, sideLegendRadarCenter, sideLegendRadarRadius } from '../utils/chartLegend';",
    );
  }

  s = s.replace(
    /grid: \{ left: '3%', right: sideLegendGrid\.right, top: '[^']+', bottom: sideLegendGrid\.bottom, containLabel: true \}/g,
    'grid: buildSideLegendGrid()',
  );
  s = s.replace(
    /grid: \{\s*left: '5%',\s*right: sideLegendGrid\.right,\s*top: '10%',\s*bottom: sideLegendGrid\.bottom,\s*containLabel: true,\s*\}/g,
    'grid: buildSideLegendGrid({ top: "6%" })',
  );

  s = s.replace(/radius: '58%'/g, "radius: sideLegendRadarRadius");
  s = s.replace(/radius: '56%'/g, "radius: sideLegendRadarRadius");
  s = s.replace(/radius: '65%'/g, "radius: sideLegendRadarRadius");
  s = s.replace(/radius: '68%'/g, "radius: sideLegendRadarRadius");

  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated', file);
}

// ScoreDistribution
{
  const fp = path.join(root, 'ScoreDistribution.tsx');
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(
    "import { buildSideLegend } from '../utils/chartLegend';",
    "import { buildSideLegend, sideLegendGrid } from '../utils/chartLegend';",
  );
  s = s.replace(
    `      grid: [
        { left: '8%', right: '14%', top: '8%', height: '52%' },
        { left: '8%', right: '14%', top: '66%', height: '24%' },
      ],`,
    `      grid: [
        { left: '6%', right: sideLegendGrid.right, top: '4%', height: '56%' },
        { left: '6%', right: sideLegendGrid.right, top: '64%', height: '28%' },
      ],`,
  );
  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated ScoreDistribution.tsx');
}

console.log('done');
