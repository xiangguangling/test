import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const fp = path.resolve(import.meta.dirname, '..', 'src', 'components', 'CrisisAlert.tsx');
const buf = execSync('git show HEAD:src/components/CrisisAlert.tsx');
let s = buf.toString('utf8');

s = s.replace(
  "import { useInView } from '../hooks/useInView';",
  "import { useOverviewInView } from '../hooks/useOverviewInView';\nimport { mountEcharts } from '../utils/chartResize';",
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

fs.writeFileSync(fp, s, 'utf8');
console.log('patched CrisisAlert.tsx');
