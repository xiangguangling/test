"""Generate PDF from the markdown documentation"""
import markdown
import sys
import os

md_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.md'
pdf_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.pdf'

with open(md_path, 'r', encoding='utf-8') as f:
    md_content = f.read()

# Convert MD to HTML
html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'codehilite'])

html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>义务教育标准化学校监测数据可视化看板 - 可视化作品解读文档</title>
<style>
@page {{ size: A4; margin: 2cm; }}
body {{ font-family: "SimSun", "Microsoft YaHei", sans-serif; font-size: 12pt; line-height: 1.8; color: #333; }}
h1 {{ font-size: 20pt; text-align: center; border-bottom: 3px solid #1a5276; padding-bottom: 12px; margin-bottom: 24px; color: #1a5276; }}
h2 {{ font-size: 15pt; border-left: 4px solid #2980b9; padding-left: 10px; margin-top: 28px; color: #1a5276; }}
h3 {{ font-size: 13pt; color: #2c3e50; margin-top: 18px; }}
table {{ border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }}
th {{ background: #2980b9; color: white; padding: 8px 10px; text-align: left; }}
td {{ border: 1px solid #ddd; padding: 6px 10px; }}
tr:nth-child(even) {{ background: #f8f9fa; }}
strong {{ color: #1a5276; }}
ul, ol {{ margin: 8px 0; padding-left: 24px; }}
li {{ margin: 4px 0; }}
code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 10pt; }}
blockquote {{ border-left: 3px solid #2980b9; padding: 8px 16px; margin: 12px 0; background: #f0f7fb; }}
</style>
</head>
<body>
{html_body}
</body>
</html>'''

# Try weasyprint first
try:
    from weasyprint import HTML
    HTML(string=html).write_pdf(pdf_path)
    print(f'PDF generated successfully: {pdf_path}')
except Exception as e:
    print(f'weasyprint failed: {e}')
    print('Trying alternative method...')
    
    # Fallback: save HTML and try pdfkit
    html_path = md_path.replace('.md', '.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    try:
        import pdfkit
        pdfkit.from_file(html_path, pdf_path)
        print(f'PDF generated with pdfkit: {pdf_path}')
    except Exception as e2:
        print(f'pdfkit also failed: {e2}')
        print(f'HTML version saved at: {html_path}')
        print('Please manually convert HTML to PDF using browser Print > Save as PDF')
