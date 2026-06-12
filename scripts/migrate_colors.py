"""Batch color migration script: old colors → Marisync palette."""
import os
import re
import glob

SRC_DIR = r'd:\desktop\AI可视化-deepseekV4\dashboard\src'

# Color mapping: old → new
COLOR_MAP = {
    '#f97316': '#ff6b2b',
    '#fb923c': '#ff8c52',
    '#ff9f43': '#ff6b2b',
    '#ff5c5c': '#ef4444',
    '#4da8ff': '#3b82f6',
    '#00d4ff': '#3b82f6',
    '#00e396': '#22c55e',
    '#10b981': '#22c55e',
    '#34d399': '#4ade80',
    '#facc15': '#f59e0b',
    '#a855f7': '#8b5cf6',
    '#4ade80': '#22c55e',
    '#22d3ee': '#60a5fa',
    '#eab308': '#f59e0b',
    '#dc2626': '#ef4444',
    '#c084fc': '#a78bfa',
    # RGBA patterns
    'rgba(255,92,92,': 'rgba(239,68,68,',
    'rgba(255,159,67,': 'rgba(255,107,43,',
    'rgba(0,212,255,': 'rgba(59,130,246,',
    'rgba(77,168,255,': 'rgba(59,130,246,',
    'rgba(168,85,247,': 'rgba(139,92,246,',
    'rgba(10,14,26,': 'rgba(6,11,20,',
    'rgba(0,227,150,': 'rgba(34,197,94,',
    'rgba(22,27,46,': 'rgba(13,21,40,',
    # Background color in chart tooltips
    "backgroundColor: 'rgba(22,27,46,0.95)'": "backgroundColor: 'rgba(13,21,40,0.95)'",
    # Border color in charts
    "borderColor: '#0a0e1a'": "borderColor: '#060b14'",
}

# Files to process
tsx_files = glob.glob(os.path.join(SRC_DIR, '**', '*.tsx'), recursive=True)
css_files = glob.glob(os.path.join(SRC_DIR, '**', '*.css'), recursive=True)
ts_files = glob.glob(os.path.join(SRC_DIR, '**', '*.ts'), recursive=True)
all_files = tsx_files + css_files + ts_files

count = 0
for filepath in all_files:
    if 'backup' in filepath or 'node_modules' in filepath:
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in COLOR_MAP.items():
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f'Updated: {os.path.relpath(filepath, SRC_DIR)}')

print(f'\nTotal files updated: {count}')
print('Done!')
