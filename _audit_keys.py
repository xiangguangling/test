"""
第三层审查：检查组件中硬编码的指标键是否存在于 JSON 数据中
"""
import json
import re
import os

with open(r'd:\desktop\AI可视化-deepseekV4\dashboard\public\dashboard_data.json', 'r', encoding='utf-8') as f:
    dash = json.load(f)

# Get all valid indicator keys from JSON
valid_keys = set(i['key'] for i in dash['indicators'])
print(f"JSON中有效指标键: {len(valid_keys)} 个")
for k in sorted(valid_keys):
    print(f"  {k}")

# Scan all TSX/TS files for indicator key references
src_dir = r'd:\desktop\AI可视化-deepseekV4\dashboard\src'
indicator_key_pattern = re.compile(r"""['"]([A-C][\d.]+[①②③④⑤⑥⑦⑧⑨⑩]+.*?得分率)['"]""")

print("\n" + "=" * 70)
print("扫描组件中的指标键引用...")
print("=" * 70)

all_refs = {}  # file -> list of keys
missing_keys = []

for root, dirs, files in os.walk(src_dir):
    for fname in files:
        if not fname.endswith(('.tsx', '.ts')):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all indicator key references
        found = indicator_key_pattern.findall(content)
        if found:
            rel = os.path.relpath(fpath, src_dir)
            all_refs[rel] = found
            for k in found:
                if k not in valid_keys:
                    missing_keys.append((rel, k))

if missing_keys:
    print(f"\n❌ 发现 {len(missing_keys)} 个无效键引用!")
    for file, key in missing_keys:
        print(f"  {file}: '{key}' 不在JSON数据中!")
else:
    print(f"\n✅ 所有组件引用的指标键都存在于JSON数据中")

# Print summary
print(f"\n扫描了 {len(all_refs)} 个文件中的指标键引用")
for fname, keys in sorted(all_refs.items()):
    unique = list(set(keys))
    if len(unique) > 5:
        print(f"  {fname}: {len(unique)} unique keys (showing first 5)")
        for k in unique[:5]:
            print(f"    - {k}")
        print(f"    ... and {len(unique)-5} more")
    else:
        print(f"  {fname}: {unique}")

# Check school type references
print("\n" + "=" * 70)
print("检查办学类型引用...")
print("=" * 70)
valid_stypes = set(dash['by_school_type'].keys())
print(f"JSON中办学类型: {valid_stypes}")

# Check urban/rural references
print(f"\nJSON中城乡分组: {set(dash['by_urban_rural'].keys())}")

# Check cross_analysis school type keys
print(f"\ncross_analysis学校类型: {set(dash['cross_analysis'].keys())}")
print(f"urban_rural_analysis城乡: {set(dash['urban_rural_analysis'].keys())}")

# Verify cross_analysis values are all valid scores
print("\n" + "=" * 70)
print("检查 cross_analysis 得分率值是否在有效范围...")
print("=" * 70)
bad_vals = []
for st, vals in dash['cross_analysis'].items():
    for k, v in vals.items():
        if v is None or v < 0 or v > 1.01:
            bad_vals.append((st, k, v))
if bad_vals:
    print(f"❌ 发现 {len(bad_vals)} 个异常值:")
    for st, k, v in bad_vals[:10]:
        print(f"  {st}[{k}] = {v}")
else:
    print("✅ 所有 cross_analysis 值在有效范围 [0, 1] 内")

# Same for urban_rural
bad_vals2 = []
for ut, vals in dash['urban_rural_analysis'].items():
    for k, v in vals.items():
        if v is None or v < 0 or v > 1.01:
            bad_vals2.append((ut, k, v))
if bad_vals2:
    print(f"❌ 发现 {len(bad_vals2)} 个异常值:")
    for ut, k, v in bad_vals2[:10]:
        print(f"  {ut}[{k}] = {v}")
else:
    print("✅ 所有 urban_rural_analysis 值在有效范围 [0, 1] 内")
