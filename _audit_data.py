"""
深度数据审查脚本 - 独立从Excel重新计算所有指标，与dashboard_data.json对比
"""
import json
import pandas as pd
import numpy as np

# ========== 1. 加载源数据 ==========
EXCEL = r'D:\desktop\AI可视化-deepseekV4\义务教育标准化学校监测数据集\[数据集]义务教育标准化学校统计监测数据.xlsx'
JSON = r'd:\desktop\AI可视化-deepseekV4\dashboard\public\dashboard_data.json'

df = pd.read_excel(EXCEL)
with open(JSON, 'r', encoding='utf-8') as f:
    dash = json.load(f)

errors = []
warnings = []
oks = []

def check(label, expected, actual, tolerance=0.01):
    """对比两个值"""
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        if abs(expected - actual) > tolerance:
            errors.append(f"❌ {label}: 期望={expected}, 实际={actual}, 差异={abs(expected-actual):.4f}")
        else:
            oks.append(f"✅ {label}: {expected}")
    elif expected != actual:
        errors.append(f"❌ {label}: 期望={expected}, 实际={actual}")
    else:
        oks.append(f"✅ {label}: {expected}")

print("=" * 70)
print("第一部分：基础统计（Overall）")
print("=" * 70)

# 学校数
check("总学校数", len(df), dash['overall']['total_schools'], 0)

# 总分统计
total_score = df['总分（44.0分）']
check("平均总分", round(float(total_score.mean()), 2), dash['overall']['avg_score'])
check("中位数总分", round(float(total_score.median()), 2), dash['overall']['median_score'])
check("最低总分", int(total_score.min()), dash['overall']['min_score'], 0)
check("最高总分", int(total_score.max()), dash['overall']['max_score'], 0)
check("标准差总分", round(float(total_score.std()), 2), dash['overall']['std_score'])

# 得分率
rate = df['得分率']
check("平均得分率", round(float(rate.mean()), 4), dash['overall']['avg_rate'])

# 满分学校
full_score = int((total_score == 44).sum())
check("满分学校数", full_score, dash['overall']['schools_full_score'], 0)

# ≥40分学校
above_40 = int((total_score >= 40).sum())
check("≥40分学校数", above_40, dash['overall']['schools_above_40'], 0)

print(f"\n基础统计: {len(oks)} 通过, {len(errors)} 错误")

# ========== 2. 办学类型统计 ==========
print("\n" + "=" * 70)
print("第二部分：办学类型统计 (by_school_type)")
print("=" * 70)

oks2 = []
errors2 = []

for st in ['小学', '初中', '九年制']:
    sub = df[df['办学类型'] == st]
    d = dash['by_school_type'].get(st, {})
    
    count = len(sub)
    avg_score = round(float(sub['总分（44.0分）'].mean()), 2)
    median_score = round(float(sub['总分（44.0分）'].median()), 2)
    std_score = round(float(sub['总分（44.0分）'].std()), 2)
    avg_rate = round(float(sub['得分率'].mean()), 4)
    
    check2 = lambda label, exp, act: errors2.append(f"❌ {st} {label}: 期望={exp}, 实际={act}") if abs(exp-act) > 0.01 else oks2.append(f"✅ {st} {label}: {exp}")
    check2("学校数", count, d.get('count', 0))
    check2("平均总分", avg_score, d.get('avg_score', 0))
    check2("中位数总分", median_score, d.get('median_score', 0))
    check2("标准差总分", std_score, d.get('std_score', 0))
    check2("平均得分率", avg_rate, d.get('avg_rate', 0))

print(f"办学类型统计: {len(oks2)} 通过, {len(errors2)} 错误")
errors.extend(errors2)
oks.extend(oks2)

# ========== 3. 城乡分组统计 ==========
print("\n" + "=" * 70)
print("第三部分：城乡分组统计 (by_urban_rural)")
print("=" * 70)

oks3 = []
errors3 = []

for ut in ['城市', '县镇', '农村']:
    sub = df[df['城乡分组'] == ut]
    d = dash['by_urban_rural'].get(ut, {})
    
    if len(sub) == 0:
        warnings.append(f"⚠️ 城乡分组 '{ut}' 无数据")
        continue
    
    count = len(sub)
    avg_score = round(float(sub['总分（44.0分）'].mean()), 2)
    median_score = round(float(sub['总分（44.0分）'].median()), 2)
    std_score = round(float(sub['总分（44.0分）'].std()), 2)
    avg_rate = round(float(sub['得分率'].mean()), 4)
    
    check3 = lambda label, exp, act: errors3.append(f"❌ {ut} {label}: 期望={exp}, 实际={act}") if abs(exp-act) > 0.01 else oks3.append(f"✅ {ut} {label}: {exp}")
    check3("学校数", count, d.get('count', 0))
    check3("平均总分", avg_score, d.get('avg_score', 0))
    check3("中位数总分", median_score, d.get('median_score', 0))
    check3("标准差总分", std_score, d.get('std_score', 0))
    check3("平均得分率", avg_rate, d.get('avg_rate', 0))

print(f"城乡分组统计: {len(oks3)} 通过, {len(errors3)} 错误")
errors.extend(errors3)
oks.extend(oks3)

# ========== 4. 指标统计 ==========
print("\n" + "=" * 70)
print("第四部分：指标统计 (indicators)")
print("=" * 70)

# Build indicator map from generate_data.py
indicator_map = {
    '得分率': '综合得分率',
    'A1.1得分率': '班级数与班额数', 'A1.2得分率': '单一校区学生总数',
    'A2.1得分率': '卫生保健室配置', 'A2.2.1得分率': '食堂等级达标',
    'A2.2.2得分率': '校内小卖部/超市达标', 'A2.3.1得分率': '饮用水供水与卫生',
    'A2.3.2得分率': '学校厕所卫生', 'A3.1.2得分率': '校园出入口安全措施',
    'A3.1.1得分率': '校园危房情况', 'A3.2.1得分率': '安全保卫人员配备',
    'A3.2.2得分率': '专职宿舍管理员配备',
    'B1.2-①生均校舍建筑面积得分率': '生均校舍建筑面积',
    'B1.2-②生均用地面积得分率': '生均用地面积',
    'B2.1-①校园办公用房面积得分率': '行政办公用房达标',
    'B2.1-②校园生活服务用房得分率': '生活用房达标',
    'B2.1-③住宿生床位配备得分率': '住宿生床位配备',
    'B3.1-①生均图书册数得分率': '生均图书册数',
    'B3.2-①图书资源配备得分率': '图书馆/阅览室达标',
    'B4.1-①教学仪器设备配备得分率': '教学仪器设备配备',
    'B4.2-①音体美器材配备情况得分率': '音体美器材配备',
    'B5.1-①无线网覆盖得分率': '无线网覆盖', 'B5.1-②师机比得分率': '师机比',
    'B5.1-③生机比得分率': '生机比', 'B6.1-①体育运动场(馆)得分率': '体育运动场(馆)',
    'B6.1-②篮、排球场地得分率': '篮/排球场地', 'B6.1-③跑道长度得分率': '跑道长度',
    'B7.1-①生均绿地面积得分率': '生均绿地面积',
    'B1.1-②普通教室数得分率': '普通教室数',
    'B1.1-①得分率': '教学用房通风采光照明',
    'B1.1-③专用教室面积得分率': '专用教室面积',
    'B1.1-④公共教学用房得分率': '公共教学用房',
    'C1.1-①得分率': '学校教职工数达标', 'C1.3-①得分率': '县级及以上骨干教师',
    'C2.1-①得分率': '教师资格证书', 'C3.1-①得分率': '专任教师培训时间',
    'C3.2-①得分率': '教师培训经费', 'C4.1-①得分率': '体育艺术专任教师',
    'C5.1-①得分率': '心理健康教师配备', 'C5.2-①得分率': '专职校医/保健人员',
    'C6.1-①得分率': '学生体育活动达标', 'C6.2-①得分率': '体质健康测试达标',
    'C2.3-①得分率': '中高级职称教师比例', 'C2.2-①得分率': '专任教师学历',
    'C1.2-①得分率': '学校生师比',
}

indicator_categories = {
    'A类-学校管理与安全': ['A1.1得分率', 'A1.2得分率', 'A2.1得分率', 'A2.2.1得分率', 'A2.2.2得分率', 'A2.3.1得分率', 'A2.3.2得分率', 'A3.1.2得分率', 'A3.1.1得分率', 'A3.2.1得分率', 'A3.2.2得分率'],
    'B类-办学硬件与环境': ['B1.1-①得分率', 'B1.1-②普通教室数得分率', 'B1.1-③专用教室面积得分率', 'B1.1-④公共教学用房得分率', 'B1.2-①生均校舍建筑面积得分率', 'B1.2-②生均用地面积得分率', 'B2.1-①校园办公用房面积得分率', 'B2.1-②校园生活服务用房得分率', 'B2.1-③住宿生床位配备得分率', 'B3.1-①生均图书册数得分率', 'B3.2-①图书资源配备得分率', 'B4.1-①教学仪器设备配备得分率', 'B4.2-①音体美器材配备情况得分率', 'B5.1-①无线网覆盖得分率', 'B5.1-②师机比得分率', 'B5.1-③生机比得分率', 'B6.1-①体育运动场(馆)得分率', 'B6.1-②篮、排球场地得分率', 'B6.1-③跑道长度得分率', 'B7.1-①生均绿地面积得分率'],
    'C类-师资队伍与发展': ['C1.1-①得分率', 'C1.2-①得分率', 'C1.3-①得分率', 'C2.1-①得分率', 'C2.2-①得分率', 'C2.3-①得分率', 'C3.1-①得分率', 'C3.2-①得分率', 'C4.1-①得分率', 'C5.1-①得分率', 'C5.2-①得分率', 'C6.1-①得分率', 'C6.2-①得分率'],
}

oks4 = []
errors4 = []

for col, name in indicator_map.items():
    if col not in df.columns:
        warnings.append(f"⚠️ 指标列 '{col}' 不在Excel中")
        continue
    
    series = df[col]
    expected_avg = round(float(series.mean()), 4)
    expected_median = round(float(series.median()), 4)
    expected_std = round(float(series.std()), 4)
    expected_fail = int((series < 1).sum())
    expected_fail_pct = round(expected_fail / len(df) * 100, 1)
    
    # Find in dashboard
    found = [i for i in dash['indicators'] if i['key'] == col]
    if not found:
        errors4.append(f"❌ 指标 '{col}' 不在dashboard_data.json中!")
        continue
    
    d = found[0]
    
    c4 = lambda label, exp, act: errors4.append(f"❌ {name}({col}) {label}: 期望={exp}, 实际={act}") if abs(exp-act) > 0.001 else None
    c4("avg_rate", expected_avg, d['avg_rate'])
    c4("median_rate", expected_median, d['median_rate'])
    c4("std_rate", expected_std, d['std_rate'])
    c4("fail_count", expected_fail, d['fail_count'])
    c4("fail_pct", expected_fail_pct, d['fail_pct'])

# Only show errors for indicators
if errors4:
    print(f"\n指标统计发现 {len(errors4)} 个错误:")
    for e in errors4:
        print(f"  {e}")
else:
    print(f"\n全部 {len(indicator_map)} 个指标统计 ✅ 通过")
errors.extend(errors4)

# ========== 5. Cross Analysis (school type × indicator) ==========
print("\n" + "=" * 70)
print("第五部分：交叉分析 (cross_analysis)")
print("=" * 70)

oks5 = []
errors5 = []

for st in ['小学', '初中', '九年制']:
    sub = df[df['办学类型'] == st]
    d_st = dash['cross_analysis'].get(st, {})
    
    for col in indicator_map:
        if col == '得分率':
            continue
        if col not in df.columns:
            continue
        
        expected = round(float(sub[col].mean()), 4)
        actual = d_st.get(col, None)
        
        if actual is None:
            errors5.append(f"❌ cross_analysis[{st}][{col}] 缺失")
        elif abs(expected - actual) > 0.001:
            errors5.append(f"❌ cross_analysis[{st}][{col}]: 期望={expected}, 实际={actual}")

if errors5:
    print(f"交叉分析发现 {len(errors5)} 个错误:")
    for e in errors5[:20]:
        print(f"  {e}")
    if len(errors5) > 20:
        print(f"  ... 及其他 {len(errors5)-20} 个")
else:
    count = sum(len(dash['cross_analysis'].get(st, {})) for st in ['小学','初中','九年制'])
    print(f"全部 {count} 个交叉分析值 ✅ 通过")
errors.extend(errors5)

# ========== 6. Urban/Rural Analysis ==========
print("\n" + "=" * 70)
print("第六部分：城乡分析 (urban_rural_analysis)")
print("=" * 70)

oks6 = []
errors6 = []

for ut in ['城市', '县镇', '农村']:
    sub = df[df['城乡分组'] == ut]
    if len(sub) == 0:
        continue
    d_ut = dash['urban_rural_analysis'].get(ut, {})
    
    for col in indicator_map:
        if col == '得分率':
            continue
        if col not in df.columns:
            continue
        
        expected = round(float(sub[col].mean()), 4)
        actual = d_ut.get(col, None)
        
        if actual is None:
            errors6.append(f"❌ urban_rural_analysis[{ut}][{col}] 缺失")
        elif abs(expected - actual) > 0.001:
            errors6.append(f"❌ urban_rural_analysis[{ut}][{col}]: 期望={expected}, 实际={actual}")

if errors6:
    print(f"城乡分析发现 {len(errors6)} 个错误:")
    for e in errors6[:20]:
        print(f"  {e}")
else:
    count = sum(len(dash['urban_rural_analysis'].get(ut, {})) for ut in ['城市','县镇','农村'])
    print(f"全部 {count} 个城乡分析值 ✅ 通过")
errors.extend(errors6)

# ========== 7. Category Summary ==========
print("\n" + "=" * 70)
print("第七部分：分类汇总 (category_summary)")
print("=" * 70)

errors7 = []

for cat, cols in indicator_categories.items():
    d_cat = dash['category_summary'].get(cat, {})
    for st in ['小学', '初中', '九年制']:
        sub = df[df['办学类型'] == st]
        rates = [float(sub[c].mean()) for c in cols if c in df.columns]
        if rates:
            expected = round(sum(rates) / len(rates), 4)
            actual = d_cat.get(st, None)
            if actual is None:
                errors7.append(f"❌ category_summary[{cat}][{st}] 缺失")
            elif abs(expected - actual) > 0.001:
                errors7.append(f"❌ category_summary[{cat}][{st}]: 期望={expected}, 实际={actual}")

if errors7:
    print(f"分类汇总发现 {len(errors7)} 个错误:")
    for e in errors7:
        print(f"  {e}")
else:
    print(f"全部分类汇总值 ✅ 通过")
errors.extend(errors7)

# ========== 8. Score Distribution ==========
print("\n" + "=" * 70)
print("第八部分：分数分布 (score_distribution)")
print("=" * 70)

dist = df['总分（44.0分）'].value_counts().sort_index()
dash_dist = {d['score']: d['count'] for d in dash['score_distribution']}

errors8 = []
for score, count in dist.items():
    dash_count = dash_dist.get(int(score), 0)
    if count != dash_count:
        errors8.append(f"❌ 分数 {score}: 期望={count}, 实际={dash_count}")

if errors8:
    print(f"分数分布发现 {len(errors8)} 个错误:")
    for e in errors8:
        print(f"  {e}")
else:
    print(f"全部 {len(dist)} 个分数分布值 ✅ 通过")
errors.extend(errors8)

# ========== 9. Bottom/Top Schools Check ==========
print("\n" + "=" * 70)
print("第九部分：头部/尾部学校")
print("=" * 70)

df_sorted = df.sort_values('总分（44.0分）')
# Check bottom 20
bottom_names_expected = [str(n) for n in df_sorted.head(20)['学校（机构）名称'].values]
bottom_names_actual = [s['name'] for s in dash['bottom_schools']]
if bottom_names_expected == bottom_names_actual:
    print(f"✅ 末尾20所学校名单正确")
else:
    print(f"❌ 末尾20所学校名单不匹配!")
    for i in range(20):
        if i < len(bottom_names_expected) and i < len(bottom_names_actual):
            if bottom_names_expected[i] != bottom_names_actual[i]:
                print(f"  第{i+1}名: 期望={bottom_names_expected[i]}, 实际={bottom_names_actual[i]}")

# Check top 20
top_names_expected = [str(n) for n in df_sorted.tail(20)['学校（机构）名称'].values][::-1]
top_names_actual = [s['name'] for s in dash['top_schools']]
if top_names_expected == top_names_actual:
    print(f"✅ 头部20所学校名单正确")
else:
    print(f"❌ 头部20所学校名单不匹配!")

# ========== FINAL SUMMARY ==========
print("\n" + "=" * 70)
print("最终审查总结")
print("=" * 70)
print(f"✅ 通过项: {len(oks)}")
print(f"❌ 错误项: {len(errors)}")
print(f"⚠️ 警告项: {len(warnings)}")

if errors:
    print("\n--- 所有错误 ---")
    for e in errors:
        print(f"  {e}")

if warnings:
    print("\n--- 所有警告 ---")
    for w in warnings:
        print(f"  {w}")

if not errors:
    print("\n🎉 所有数据审查通过！dashboard_data.json 与源Excel数据完全一致。")
else:
    print(f"\n⚠️ 发现 {len(errors)} 个数据不一致，需要重新生成 dashboard_data.json。")
