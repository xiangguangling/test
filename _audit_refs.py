import json, os, re

with open(r'd:\desktop\AI可视化-deepseekV4\dashboard\public\dashboard_data.json', 'r', encoding='utf-8') as f:
    dash = json.load(f)
valid_keys = set(i['key'] for i in dash['indicators'])

src = r'd:\desktop\AI可视化-deepseekV4\dashboard\src'

# Pattern: Chinese indicator keys with 得分率 suffix
found_keys = set()
unknown_keys = set()

for root, dirs, files in os.walk(src):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts')):
            continue
        fpath = os.path.join(root, fn)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check each valid key against file content
        for vk in valid_keys:
            if vk in content:
                found_keys.add(vk)

print(f"在组件中找到 {len(found_keys)} 个有效指标键")

missing = valid_keys - found_keys - {'得分率'}
if missing:
    print(f"\nJSON中有但组件未引用的键 ({len(missing)} 个):")
    for k in sorted(missing):
        print(f"  {k}")
else:
    print("\n✅ 所有JSON指标键都在组件中被引用")

# Also check for any keys in components that look like indicators but aren't in JSON
# Look for patterns like X得分率
suspicious = set()
pat = re.compile(r"['\"]([A-C][\d.\-①②③④⑤⑥⑦⑧⑨⑩]+.*?得分率)['\"]")
for root, dirs, files in os.walk(src):
    for fn in files:
        if not fn.endswith(('.tsx', '.ts')):
            continue
        fpath = os.path.join(root, fn)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        for m in pat.finditer(content):
            k = m.group(1)
            if k not in valid_keys and k != '得分率':
                suspicious.add((fn, k))

if suspicious:
    print(f"\n❌ 组件中引用了不存在的键 ({len(suspicious)} 个):")
    for fn, k in sorted(suspicious):
        print(f"  {fn}: '{k}'")
else:
    print("\n✅ 没有无效的指标键引用")
