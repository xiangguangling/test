import pandas as pd
import json

df = pd.read_excel(r'D:\desktop\AI可视化-deepseekV4\义务教育标准化学校监测数据集\[数据集]义务教育标准化学校统计监测数据.xlsx')
with open(r'd:\desktop\AI可视化-deepseekV4\dashboard\public\dashboard_data.json', 'r', encoding='utf-8') as f:
    dash = json.load(f)

df_sorted = df.sort_values('总分（44.0分）')

print('=== 末尾20所 (最低分) ===')
for i, (_, row) in enumerate(df_sorted.head(20).iterrows()):
    d = dash['bottom_schools'][i] if i < len(dash['bottom_schools']) else {}
    name_e = str(row['学校（机构）名称'])
    name_a = d.get('name','?')
    score_e = int(row['总分（44.0分）'])
    score_a = d.get('score','?')
    match = 'OK' if name_e == name_a and score_e == score_a else 'MISMATCH'
    print(f'  {match} #{i+1}: Excel={name_e}({score_e}) vs JSON={name_a}({score_a})')

print()
print('=== 头部20所 (最高分) ===')
tail = df_sorted.tail(20)
for i, (_, row) in enumerate(tail.iterrows()):
    idx = 19 - i
    d = dash['top_schools'][idx] if idx < len(dash['top_schools']) else {}
    name_e = str(row['学校（机构）名称'])
    name_a = d.get('name','?')
    score_e = int(row['总分（44.0分）'])
    score_a = d.get('score','?')
    match = 'OK' if name_e == name_a and score_e == score_a else 'MISMATCH'
    print(f'  {match} #{idx+1}: Excel={name_e}({score_e}) vs JSON={name_a}({score_a})')

print()
print('=== 满分学校 ===')
full = df[df['总分（44.0分）'] == 44]
print(f'Excel满分学校数: {len(full)}')
print(f'JSON满分学校数: {dash["overall"]["schools_full_score"]}')

# Check duplicate scores at the boundary
print()
print('=== 得分边界检查 ===')
scores = df_sorted['总分（44.0分）'].values
print(f'最低20所分数: {scores[:20].tolist()}')
print(f'最高20所分数: {scores[-20:].tolist()}')
print(f'第20名分数: {scores[19]}, 第21名分数: {scores[20]}')
print(f'倒数第20名分数: {scores[-20]}, 倒数第21名分数: {scores[-21]}')
