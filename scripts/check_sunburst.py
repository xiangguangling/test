import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / 'public' / 'dashboard_data.json'
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

indicators = data['indicators']

cats = {}
for ind in indicators:
    cat = ind.get('category', '其他')
    if cat not in cats:
        cats[cat] = []
    cats[cat].append(ind)

for cat, items in cats.items():
    print(f'{cat}: {len(items)} indicators, total fails: {sum(i["fail_count"] for i in items)}')
    for item in sorted(items, key=lambda x: x['fail_count'], reverse=True)[:5]:
        print(f'  {item["name"]}: fail={item["fail_count"]}, rate={item["avg_rate"]:.3f}')
