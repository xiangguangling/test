# 义务教育标准化学校监测数据可视化看板

> 2026年温州市第二届教育数据可视化技能大赛 · 指定数源赛道

## 在线访问

| 环境 | 地址 |
|------|------|
| GitHub Pages（生产） | https://xiangguangling.github.io/test/ |
| 本地开发 | http://localhost:5173/ |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 一键启动（可选）
# Windows: scripts\start.bat
# macOS/Linux: scripts/start.sh

# 生产构建
npm run build

# 本地预览构建结果
npm run preview
```

构建产物位于 `dist/`，可部署到任意静态托管（Nginx、GitHub Pages、Vercel 等）。

## 部署说明

### GitHub Pages（推荐）

1. 在仓库根目录创建 `.github/workflows/deploy.yml`（内容见 [`docs/deploy-workflow.yml`](docs/deploy-workflow.yml)）
2. 打开 **Settings → Pages**，**Source** 选择 **GitHub Actions**
3. 推送到 `master` 后 Actions 自动构建并发布

> 若本地 `git push` 提示缺少 `workflow` 权限，请在 GitHub 网页端新建 workflow 文件，或为 Personal Access Token 勾选 `workflow` scope。

**Base 路径：** `vite.config.ts` 在 CI 环境使用 `base: '/test/'`，与仓库名 `xiangguangling/test` 对应。若更换仓库名，需同步修改 `base`。

### 手动部署

```bash
npm ci
npm run build
# 将 dist/ 目录内容上传至静态服务器根目录
```

## 看板结构

应用采用 **5 个主题页签**，顶部导航切换；「总体概览」为纵向 snap 滚动多屏布局，其余页为 KPI + 图表网格。

| 页签 | 模块 | 主要图表 / 组件 | 说明 |
|------|------|-----------------|------|
| **总体概览** | KPI 指标条 | 动画 StatCard × 6 | 学校总数、均分、得分率、满分校、最低分、≥40 分占比 |
| | 全局统计 | 环形进度 + 同心径向图 | 三大维度得分概览 |
| | 趋势与类型 | 面积图 + 学校类型得分率 | 分数分布与类型对比 |
| | 核心雷达 | 玫瑰图 + 16 项指标雷达 | 多类学校指标对比 |
| | 流向分析 | 桑基图 + 关联网络图 | 维度→指标→不达标流向 |
| | 结构对比 | 堆叠柱状图 + 三类×维度分组柱 | 学校类型与维度交叉 |
| | 备用图表区 | 箱线图、热力图、短板条形等 | 总分分布、城乡差异、低分校监测 |
| **区域分析** | 城乡对比 | 柱状图、雷达、热力图、散点、折线 | 城市 / 县镇 / 农村多维对比 |
| **安全管理** | A 类指标 | 横向条形图 + 安全指标网格 | 11 项管理与安全指标监测 |
| **硬件设施** | B 类指标 | 条形图 + 学校类型热力图 + 设施网格 | 20 项硬件与环境指标 |
| **师资队伍** | C 类指标 | 雷达、热力图、棒棒糖图 + 师资网格 | 13 项师资与发展指标 |

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 图表 | ECharts 5 / echarts-gl（柱状、箱线、雷达、桑基、热力、仪表盘、玫瑰、网络等） |
| 样式 | Tailwind CSS 4（设计令牌见 `src/index.css`） |
| 动画 | GSAP（加载屏、数字滚动、图表入场） |
| 3D / 特效 | Three.js、OGL（部分背景与可视化） |

## 项目结构

```
├── index.html
├── package.json
├── vite.config.ts              # base 路径、构建输出
├── tsconfig.json
├── .github/workflows/deploy.yml # GitHub Pages 自动部署
├── public/
│   ├── dashboard_data.json     # 运行时加载的预处理数据
│   └── campus-3d-bg.png
├── data/
│   └── dashboard_dataset.csv   # 原始 CSV（开发参考，不参与运行时加载）
├── scripts/
│   ├── start.bat / start.sh    # 本地一键启动
│   ├── sync-github.bat         # 推送至 GitHub 辅助脚本
│   ├── sync-to-github.ps1
│   └── analyze_data.py         # 数据分析脚本
└── src/
    ├── main.tsx
    ├── App.tsx                 # 页签路由、加载态
    ├── index.css               # 全局样式 + @theme 设计令牌
    ├── types/index.ts          # DashboardData 等类型
    ├── hooks/
    │   ├── useData.ts          # 加载 public/dashboard_data.json
    │   ├── useChart.ts / useEcharts.ts
    │   └── useChartViewportReveal.ts
    ├── contexts/OverviewScrollContext.tsx
    ├── utils/
    │   ├── chartResize.ts      # ECharts 挂载、响应式、Sankey 入场
    │   ├── heatmapVisualMap.ts
    │   └── lightChartTheme.ts
    └── components/
        ├── PageTitle.tsx       # 顶栏 + 五页导航
        ├── LoadingScreen.tsx
        ├── OverviewPage.tsx    # 概览 snap 布局
        ├── RegionalPage.tsx
        ├── SafetyPage.tsx
        ├── FacilityPage.tsx
        ├── FacultyPage.tsx
        ├── TabPageLayout.tsx
        ├── StatCard.tsx / ChartCard.tsx / FlipCard.tsx
        ├── SankeyPassFlow.tsx / IndicatorRadar.tsx / ...
        └── figma/              # Figma 对齐的可视化子组件
```

## 数据说明

| 项目 | 内容 |
|------|------|
| 数据来源 | 温州市教育局脱敏数据集（技能大赛指定数源） |
| 数据规模 | 855 所学校 × 44 项监测指标 |
| 三大维度 | A 学校管理与安全（11 分）、B 办学硬件与环境（20 分）、C 师资队伍与发展（13 分） |
| 分类维度 | 办学类型（小学 / 初中 / 九年制）、城乡分组（城市 / 县镇 / 农村） |
| 运行时数据 | `public/dashboard_data.json`（由 CSV 预处理生成） |

## 可视化解读文档

### 主题

基于义务教育标准化学校监测数据的多维度可视化分析看板。

### 应用场景

面向教育主管部门，对辖区内义务教育学校标准化建设进行监测评估与决策支持；支持从总体、区域、安全、硬件、师资五个视角快速定位短板。

### 核心亮点

1. **多页多维**：5 个主题页 + 概览页 10+ 种图表，覆盖总量、结构、流向、对比、预警。
2. **数据驱动洞察**：各图表配套 `ChartInsights` 文案，实现「看图说话」。
3. **Snap 滚动概览**：概览页按 KPI → 英雄区 → 桑基/网络 → 堆叠对比分段呈现，适配大屏展示。
4. **统一视觉体系**：Tailwind 设计令牌 + Figma 对齐组件，Poppins / Open Sans 字体分层。
5. **自动化部署**：推送即构建，GitHub Pages 持续发布。

### 教育故事（三条叙事线）

1. **公共教学用房的「隐形危机」** — 超过半数学校未达标，制约素质教育空间保障。
2. **师资结构性短板** — 编制、职称、音体美专任等多指标联动暴露三重困境。
3. **城乡与类型差异** — 九年制 > 初中 > 小学；城市总体优于县镇、农村，部分硬件指标城乡差距显著。

### 参赛材料清单

| 材料 | 状态 |
|------|------|
| 作品公开链接 | ✅ https://xiangguangling.github.io/test/ |
| 作品全屏截图 | ⬜ 待补充 |
| 可视化解读文档 | ✅ 见本文「可视化解读文档」章节 |
| 演示视频 | ⬜ 可选 |
| 数据安全保护承诺书 | ⬜ 待补充 |

## 仓库说明

| 仓库 | 用途 |
|------|------|
| [xiangguangling/test](https://github.com/xiangguangling/test) | 主工程 + GitHub Pages 线上部署 |
| [xiangguangling/dashboard](https://github.com/xiangguangling/dashboard) | 历史版本备份归档 |

## 开发备注

- 本地 `npm run dev` 使用相对路径 `base: './'`；CI 构建使用 `base: '/test/'`。
- 图表容器需有明确宽高；`chartResize.ts` 负责 resize 与视口入场动画。
- 自动同步脚本 `scripts/sync-to-github.ps1` 可用于本地变更批量推送（需配置 Git 凭据）。

## 许可证

本项目为技能大赛参赛作品，数据已脱敏，请勿用于商业用途。
