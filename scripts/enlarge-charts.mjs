import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..', 'src', 'components');

const barFiles = [
  'RegionalGrid.tsx',
  'SchoolTypeComparison.tsx',
  'RegionalAnalysis.tsx',
  'SafetyGrid.tsx',
  'SafetyAnalysis.tsx',
  'FacultyAnalysis.tsx',
  'FacilityAnalysis.tsx',
  'FacultyGrid.tsx',
  'FacilityGrid.tsx',
];

for (const file of barFiles) {
  const fp = path.join(root, file);
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(/barWidth: '22%'/g, "barWidth: '28%'");
  s = s.replace(/barWidth: '20%'/g, "barWidth: '26%'");
  s = s.replace(
    /grid: \{ left: '14%', right: '8%', top: '14%', bottom: '5%' \}/g,
    'grid: buildSideLegendGrid({ left: "8%", top: "6%" })',
  );
  s = s.replace(
    /grid: \{ left: '14%', right: '6%', top: '10%', bottom: '16%', containLabel: true \}/g,
    'grid: buildSideLegendGrid({ left: "8%", top: "4%" })',
  );
  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated', file);
}

// ScoreDistribution — 双 grid 撑满
{
  const fp = path.join(root, 'ScoreDistribution.tsx');
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(
    /grid: \[\s*\{ left: '[^']+', right: '[^']+', top: '[^']+', height: '[^']+' \},\s*\{ left: '[^']+', right: '[^']+', top: '[^']+', height: '[^']+' \},\s*\]/,
    `grid: [
        { left: '4%', right: sideLegendGrid.right, top: '2%', height: '58%' },
        { left: '4%', right: sideLegendGrid.right, top: '63%', height: '30%' },
      ]`,
  );
  fs.writeFileSync(fp, s, 'utf8');
  console.log('updated ScoreDistribution.tsx');
}

console.log('done');
