"""Simple PDF generation using fpdf2 - robust version"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

try:
    from fpdf import FPDF
    
    md_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.md'
    pdf_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.pdf'
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pdf = FPDF()
    pdf.add_page()
    
    # Try to add Chinese font
    font_ok = False
    for font_path in [r'C:\Windows\Fonts\simsun.ttc', r'C:\Windows\Fonts\msyh.ttc', r'C:\Windows\Fonts\simhei.ttf']:
        try:
            pdf.add_font('CN', '', font_path)
            pdf.add_font('CNB', '', font_path) 
            font_ok = True
            break
        except:
            continue
    
    if font_ok:
        pdf.set_font('CN', '', 10)
        print('Using Chinese font')
    else:
        pdf.set_font('Helvetica', '', 10)
        print('Using fallback font')
    
    # Write content as simple paragraphs
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue
        
        # Skip markdown formatting characters for simple rendering
        if line.startswith('```'):
            continue
        if line.startswith('|') and '---' in line:
            continue
        
        # Clean the line
        import re
        clean = re.sub(r'\*\*', '', line)
        clean = re.sub(r'`', '', clean)
        clean = re.sub(r'\[.*?\]\(.*?\)', '', clean)
        clean = re.sub(r'^#+\s*', '', clean)
        clean = re.sub(r'^[-*]\s+', '  • ', clean)
        
        if clean.strip():
            try:
                pdf.multi_cell(0, 5, clean)
            except:
                # Skip characters that can't be rendered
                safe = clean.encode('ascii', errors='replace').decode('ascii')
                if safe.strip():
                    pdf.multi_cell(0, 5, safe)
    
    pdf.output(pdf_path)
    print(f'PDF generated: {pdf_path}')
    print(f'Pages: {pdf.pages_count}')
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
