export interface OverallStats {
  total_schools: number;
  avg_score: number;
  median_score: number;
  min_score: number;
  max_score: number;
  std_score: number;
  avg_rate: number;
  schools_full_score: number;
  schools_above_40: number;
}

export interface SchoolTypeStats {
  count: number;
  avg_score: number;
  median_score: number;
  std_score: number;
  avg_rate: number;
}

export interface UrbanRuralStats {
  count: number;
  avg_score: number;
  median_score: number;
  std_score: number;
  avg_rate: number;
}

export interface Indicator {
  key: string;
  name: string;
  avg_rate: number;
  median_rate: number;
  std_rate: number;
  fail_count: number;
  fail_pct: number;
  pass_count: number;
  category: string;
}

export interface ScoreDistItem {
  score: number;
  count: number;
}

export interface SchoolInfo {
  name: string;
  type: string;
  area: string;
  score: number;
  rate: number;
}

export interface DashboardData {
  overall: OverallStats;
  by_school_type: Record<string, SchoolTypeStats>;
  by_urban_rural: Record<string, UrbanRuralStats>;
  indicators: Indicator[];
  score_distribution: ScoreDistItem[];
  cross_analysis: Record<string, Record<string, number>>;
  urban_rural_analysis: Record<string, Record<string, number>>;
  bottom_schools: SchoolInfo[];
  top_schools: SchoolInfo[];
  category_summary: Record<string, Record<string, number>>;
}
