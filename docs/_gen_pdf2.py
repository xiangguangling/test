"""Generate PDF from MD using fpdf2 (no external deps needed)"""
from fpdf import FPDF
import re

md_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.md'
pdf_path = r'd:\desktop\AI可视化-deepseekV4\dashboard\docs\可视化作品解读文档.pdf'

class ChinesePDF(FPDF):
    def __init__(self):
        super().__init__('P', 'mm', 'A4')
        # Add Chinese font
        font_dir = r'C:\Windows\Fonts'
        try:
            self.add_font('SimSun', '', r'C:\Windows\Fonts\simsun.ttc', uni=True)
            self.add_font('SimHei', '', r'C:\Windows\Fonts\simhei.ttf', uni=True)
            self.cn_font = 'SimSun'
            self.cn_bold = 'SimHei'
        except:
            self.cn_font = 'Helvetica'
            self.cn_bold = 'Helvetica'
    
    def header(self):
        self.set_font(self.cn_font, '', 8)
        self.set_text_color(128,128,128)
        self.cell(0, 5, '义务教育标准化学校监测数据可视化看板 - 可视化作品解读文档', align='C')
        self.ln(8)
    
    def footer(self):
        self.set_y(-15)
        self.set_font(self.cn_font, '', 8)
        self.set_text_color(128,128,128)
        self.cell(0, 10, f'{self.page_no()}', align='C')

pdf = ChinesePDF()
pdf.set_auto_page_break(True, 20)
pdf.add_page()

with open(md_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

i = 0
while i < len(lines):
    line = lines[i].rstrip()
    
    # Title (h1)
    if line.startswith('# ') and not line.startswith('## '):
        pdf.set_font(pdf.cn_bold, '', 18)
        pdf.set_text_color(26, 82, 118)
        text = line[2:].strip()
        pdf.cell(0, 12, text, align='C')
        pdf.ln(16)
        # Underline
        pdf.set_draw_color(26, 82, 118)
        pdf.set_line_width(0.5)
        y = pdf.get_y()
        pdf.line(20, y, 190, y)
        pdf.ln(6)
    
    # Section (h2)
    elif line.startswith('## '):
        pdf.set_font(pdf.cn_bold, '', 14)
        pdf.set_text_color(26, 82, 118)
        text = line[3:].strip()
        # Draw left border
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.set_fill_color(41, 128, 185)
        pdf.rect(15, y, 3, 8, 'F')
        pdf.set_x(22)
        pdf.cell(0, 8, text)
        pdf.ln(12)
    
    # Sub-section (h3)
    elif line.startswith('### '):
        pdf.set_font(pdf.cn_bold, '', 12)
        pdf.set_text_color(44, 62, 80)
        text = line[4:].strip()
        pdf.cell(0, 8, text)
        pdf.ln(10)
    
    # Bold text marker
    elif line.startswith('**') and line.endswith('**'):
        pdf.set_font(pdf.cn_bold, '', 11)
        pdf.set_text_color(26, 82, 118)
        text = line[2:-2].strip()
        pdf.cell(0, 7, text)
        pdf.ln(8)
    
    # Table rows
    elif line.startswith('|'):
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if all(c.startswith('---') for c in cells if c):
            continue  # skip separator line
        if any(c.startswith('---') for c in cells):
            continue
        
        is_header = (i+1 < len(lines) and lines[i+1].strip().startswith('|') and '---' in lines[i+1])
        
        col_w = 170 / max(len(cells), 1)
        for j, cell in enumerate(cells):
            if is_header:
                pdf.set_font(pdf.cn_bold, '', 9)
                pdf.set_fill_color(41, 128, 185)
                pdf.set_text_color(255, 255, 255)
            else:
                pdf.set_font(pdf.cn_font, '', 9)
                pdf.set_text_color(51, 51, 51)
                if (sum(1 for _ in lines[:i] if _.startswith('|'))) % 2 == 0:
                    pdf.set_fill_color(248, 249, 250)
                else:
                    pdf.set_fill_color(255, 255, 255)
            
            pdf.cell(col_w, 7, cell, border=0, fill=True)
        pdf.ln(7)
    
    # List items
    elif line.startswith('- ') or line.startswith('* '):
        pdf.set_font(pdf.cn_font, '', 10)
        pdf.set_text_color(51, 51, 51)
        text = line[2:].strip()
        # Handle nested bold
        pdf.set_x(22)
        pdf.cell(4, 6, '•')
        # Simple text
        text_clean = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text_clean = re.sub(r'`(.+?)`', r'\1', text_clean)
        pdf.set_x(26)
        pdf.cell(0, 6, text_clean)
        pdf.ln(7)
    
    # Ordered list
    elif re.match(r'^\d+\.', line):
        pdf.set_font(pdf.cn_font, '', 10)
        pdf.set_text_color(51, 51, 51)
        text = re.sub(r'^\d+\.\s*', '', line)
        text_clean = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text_clean = re.sub(r'`(.+?)`', r'\1', text_clean)
        pdf.set_x(22)
        pdf.cell(0, 6, text_clean)
        pdf.ln(7)
    
    # Code blocks
    elif line.startswith('```'):
        i += 1
        while i < len(lines) and not lines[i].startswith('```'):
            pdf.set_font('Courier', '', 8)
            pdf.set_text_color(80, 80, 80)
            pdf.set_fill_color(244, 244, 244)
            pdf.set_x(22)
            pdf.cell(0, 5, lines[i].rstrip()[:100], fill=True)
            pdf.ln(5)
            i += 1
    
    # Normal paragraph text
    elif line.strip():
        pdf.set_font(pdf.cn_font, '', 10.5)
        pdf.set_text_color(51, 51, 51)
        # Clean markdown formatting
        text = line.strip()
        # Handle inline code
        parts = re.split(r'`([^`]+)`', text)
        x_start = pdf.get_x()
        for idx, part in enumerate(parts):
            if idx % 2 == 0:
                # Remove bold markers for simplicity
                part = re.sub(r'\*\*(.+?)\*\*', r'\1', part)
                pdf.set_font(pdf.cn_font, '', 10.5)
                pdf.set_text_color(51, 51, 51)
            else:
                pdf.set_font('Courier', '', 9)
                pdf.set_text_color(200, 80, 80)
            pdf.write(5.5, part)
        pdf.ln(7)
    
    # Empty line
    elif line == '':
        pdf.ln(2)
    
    i += 1

pdf.output(pdf_path)
print(f'PDF generated: {pdf_path}')
print(f'Pages: {pdf.page_no()}')
