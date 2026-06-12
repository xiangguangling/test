import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / 'public' / 'dashboard_data.json'
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Urban/Rural Analysis
print('=== Urban/Rural Analysis ===')
for area in ['城市', '县镇', '农村']:
    if area in data.get('urban_rural_analysis', {}):
        rates = data['urban_rural_analysis'][area]
        diffs = []
        for k, v in rates.items():
            others = [data['urban_rural_analysis'][a][k] for a in ['城市', '县镇', '农村']
                      if a != area and a in data['urban_rural_analysis'] and k in data['urban_rural_analysis'][a]]
            if others:
                avg_other = sum(others) / len(others)
                diffs.append((k, v, avg_other, v - avg_other))
        diffs.sort(key=lambda x: abs(x[3]), reverse=True)
        count = data['by_urban_rural'][area]['count']
        print(f'\n{area} (schools: {count})')
        for d in diffs[:5]:
            print(f'  {d[0]}: rate={d[1]:.3f}, vs others={d[2]:.3f}, diff={d[3]:+.3f}')

print()
print('=== Category Summary ===')
for cat, vals in data.get('category_summary', {}).items():
    print(f'{cat}: primary={vals.get("小学",0):.3f}, middle={vals.get("初中",0):.3f}, nineyear={vals.get("九年制",0):.3f}')
