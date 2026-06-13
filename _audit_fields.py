"""
第二层审查：检查所有组件引用的数据字段是否存在于 dashboard_data.json 中
"""
import json

with open(r'd:\desktop\AI可视化-deepseekV4\dashboard\public\dashboard_data.json', 'r', encoding='utf-8') as f:
    dash = json.load(f)

print("=" * 70)
print("数据字段存在性检查")
print("=" * 70)

# 1. Check overall structure
print("\n--- overall ---")
for k in ['total_schools','avg_score','median_score','min_score','max_score','std_score','avg_rate','schools_full_score','schools_above_40']:
    v = dash['overall'].get(k)
    print(f"  overall.{k} = {v} (type={type(v).__name__})")

# 2. Check by_school_type
print("\n--- by_school_type ---")
for st in ['小学','初中','九年制']:
    if st in dash['by_school_type']:
        d = dash['by_school_type'][st]
        print(f"  {st}: count={d['count']}, avg_score={d['avg_score']}, avg_rate={d['avg_rate']}")
    else:
        print(f"  {st}: MISSING!")

# 3. Check by_urban_rural
print("\n--- by_urban_rural ---")
for ut in ['城市','县镇','农村']:
    if ut in dash['by_urban_rural']:
        d = dash['by_urban_rural'][ut]
        print(f"  {ut}: count={d['count']}, avg_score={d['avg_score']}, avg_rate={d['avg_rate']}")
    else:
        print(f"  {ut}: MISSING!")

# 4. Check indicators categories
print("\n--- indicators by category ---")
cats = {}
for ind in dash['indicators']:
    cat = ind.get('category', 'unknown')
    if cat not in cats:
        cats[cat] = []
    cats[cat].append(ind['key'])
for cat, keys in sorted(cats.items()):
    print(f"  {cat}: {len(keys)} indicators")
    for k in keys:
        print(f"    - {k}")

# 5. Check cross_analysis keys
print("\n--- cross_analysis indicator coverage ---")
for st in ['小学','初中','九年制']:
    keys = list(dash['cross_analysis'].get(st, {}).keys())
    print(f"  {st}: {len(keys)} indicators")

# 6. Check urban_rural_analysis keys
print("\n--- urban_rural_analysis indicator coverage ---")
for ut in ['城市','县镇','农村']:
    keys = list(dash['urban_rural_analysis'].get(ut, {}).keys())
    print(f"  {ut}: {len(keys)} indicators")

# 7. Check category_summary
print("\n--- category_summary ---")
for cat, vals in dash['category_summary'].items():
    print(f"  {cat}: {vals}")

# 8. Check score_distribution range
print("\n--- score_distribution ---")
scores = [d['score'] for d in dash['score_distribution']]
counts = [d['count'] for d in dash['score_distribution']]
print(f"  Score range: {min(scores)}-{max(scores)}")
print(f"  Total schools: {sum(counts)}")

# 9. Check bottom_schools fields
print("\n--- bottom_schools sample ---")
for s in dash['bottom_schools'][:3]:
    print(f"  {s['name']}: score={s['score']}, type={s['type']}, area={s['area']}, rate={s['rate']}")

# 10. Check top_schools fields
print("\n--- top_schools sample ---")
for s in dash['top_schools'][-3:]:
    print(f"  {s['name']}: score={s['score']}, type={s['type']}, area={s['area']}, rate={s['rate']}")

# 11. Verify total count correctness
print("\n--- 一致性检查 ---")
ind_count = dash['overall']['total_schools']
by_type_count = sum(v['count'] for v in dash['by_school_type'].values())
by_ur_count = sum(v['count'] for v in dash['by_urban_rural'].values())
dist_count = sum(d['count'] for d in dash['score_distribution'])
print(f"  overall.total_schools = {ind_count}")
print(f"  sum(by_school_type.count) = {by_type_count}")
print(f"  sum(by_urban_rural.count) = {by_ur_count}")
print(f"  sum(score_distribution.count) = {dist_count}")
if ind_count == by_type_count == by_ur_count == dist_count:
    print("  ✅ 所有计数一致!")
else:
    print("  ❌ 计数不一致!")

# 12. Check that cross_analysis indicator keys match indicators list
print("\n--- 指标键名一致性 ---")
ind_keys = set(i['key'] for i in dash['indicators'] if i['key'] != '得分率')
cross_keys = set()
for st in ['小学','初中','九年制']:
    cross_keys.update(dash['cross_analysis'].get(st, {}).keys())
ur_keys = set()
for ut in ['城市','县镇','农村']:
    ur_keys.update(dash['urban_rural_analysis'].get(ut, {}).keys())

print(f"  indicators中指标数(排除综合): {len(ind_keys)}")
print(f"  cross_analysis中指标数: {len(cross_keys)}")
print(f"  urban_rural中指标数: {len(ur_keys)}")

only_in_indicators = ind_keys - cross_keys
only_in_cross = cross_keys - ind_keys
only_in_ur = ur_keys - ind_keys
missing_in_ur = ind_keys - ur_keys

if only_in_indicators:
    print(f"  ⚠️ 仅在indicators中: {only_in_indicators}")
if only_in_cross:
    print(f"  ⚠️ 仅在cross_analysis中: {only_in_cross}")
if only_in_ur:
    print(f"  ⚠️ 仅在urban_rural中: {only_in_ur}")
if missing_in_ur:
    print(f"  ⚠️ indicators有但urban_rural缺失: {missing_in_ur}")
if not any([only_in_indicators, only_in_cross, only_in_ur, missing_in_ur]):
    print("  ✅ 所有键名一致!")
