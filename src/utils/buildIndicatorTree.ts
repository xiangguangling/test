import type { DashboardData, Indicator } from '../types';

export interface TreeLeaf {
  id: string;
  name: string;
  rate: number;
}

export interface TreeSubgroup {
  id: string;
  label: string;
  rate: number;
  count: number;
  leaves: TreeLeaf[];
}

export interface TreeCategory {
  id: string;
  label: string;
  shortLabel: string;
  rate: number;
  count: number;
  color: string;
  gradient: [string, string];
  subgroups: TreeSubgroup[];
}

export interface IndicatorTree {
  root: { label: string; rate: number; totalSchools: number };
  categories: TreeCategory[];
}

const CATEGORY_META = [
  {
    id: 'A',
    key: 'A类-学校管理与安全',
    shortLabel: '安全管理',
    color: '#8676FF',
    gradient: ['#895BED', '#55D6FF'] as [string, string],
  },
  {
    id: 'B',
    key: 'B类-办学硬件与环境',
    shortLabel: '硬件设施',
    color: '#FF708B',
    gradient: ['#F77593', '#E94578'] as [string, string],
  },
  {
    id: 'C',
    key: 'C类-师资队伍与发展',
    shortLabel: '师资发展',
    color: '#66C8FF',
    gradient: ['#35C8FF', '#2649FF'] as [string, string],
  },
];

const SUBGROUP_LABELS: Record<string, string> = {
  'A1.1': '班级规模', 'A1.2': '学生规模', 'A2.1': '保健室', 'A2.2': '食堂小卖部',
  'A2.3': '饮水厕所', 'A3.1': '校园安全', 'A3.2': '安保配备',
  'B1.1': '校舍教室', 'B1.2': '用地建筑', 'B2.1': '生活办公', 'B3.1': '图书册数',
  'B3.2': '图书室', 'B4.1': '教学设备', 'B4.2': '音体美器', 'B5.1': '信息化',
  'B6.1': '体育场地', 'B7.1': '绿地面积',
  'C1.1': '教职工数', 'C1.2': '生师比', 'C1.3': '骨干教师', 'C2.1': '教师资格',
  'C2.2': '学历达标', 'C2.3': '职称比例', 'C3.1': '培训时间', 'C3.2': '培训经费',
  'C4.1': '音体美教师', 'C5.1': '心理教师', 'C5.2': '校医配备',
  'C6.1': '体育活动', 'C6.2': '体质测试',
};

function subgroupKey(ind: Indicator): string {
  const m = ind.key.match(/^([A-C]\d+(?:\.\d+)?)/);
  return m ? m[1] : ind.key;
}

export function buildIndicatorTree(data: DashboardData): IndicatorTree {
  const indicators = data.indicators.filter(i => i.key !== '得分率' && i.category);

  const categories = CATEGORY_META.map(meta => {
    const items = indicators.filter(i => i.category === meta.key);
    const grouped = new Map<string, Indicator[]>();

    items.forEach(ind => {
      const key = subgroupKey(ind);
      const list = grouped.get(key) ?? [];
      list.push(ind);
      grouped.set(key, list);
    });

    const subgroups = [...grouped.entries()]
      .map(([id, list]) => {
        const rate = list.reduce((s, i) => s + i.avg_rate, 0) / list.length;
        const leaves = list
          .sort((a, b) => a.avg_rate - b.avg_rate)
          .map(ind => ({
            id: ind.key,
            name: ind.name,
            rate: ind.avg_rate,
          }));
        return {
          id,
          label: SUBGROUP_LABELS[id] ?? id,
          rate,
          count: list.length,
          leaves,
        };
      })
      .sort((a, b) => a.rate - b.rate);

    const rate = items.reduce((s, i) => s + i.avg_rate, 0) / (items.length || 1);

    return {
      id: meta.id,
      label: meta.key,
      shortLabel: meta.shortLabel,
      rate,
      count: items.length,
      color: meta.color,
      gradient: meta.gradient,
      subgroups,
    };
  });

  return {
    root: {
      label: '综合得分率',
      rate: data.overall.avg_rate,
      totalSchools: data.overall.total_schools,
    },
    categories,
  };
}
