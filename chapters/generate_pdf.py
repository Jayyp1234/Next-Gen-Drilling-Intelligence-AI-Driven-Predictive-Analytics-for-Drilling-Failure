#!/usr/bin/env python3
"""Generate a polished PDF from the DrillGuard demo walkthrough script."""

import markdown
from weasyprint import HTML

# Read the markdown file
with open('/Users/temp-laptop/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure/chapters/demo_walkthrough_script.md', 'r') as f:
    md_content = f.read()

# Convert markdown to HTML
md_html = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

# Wrap in styled HTML
html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  @page {{
    size: A4;
    margin: 2.2cm 2cm 2.5cm 2cm;
    @top-right {{
      content: "CONFIDENTIAL";
      font-family: 'Inter', sans-serif;
      font-size: 7pt;
      color: #8B949E;
      letter-spacing: 2px;
    }}
    @bottom-center {{
      content: counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #8B949E;
    }}
  }}

  @page :first {{
    margin-top: 0;
    @top-right {{ content: none; }}
    @bottom-center {{ content: none; }}
  }}

  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10pt;
    line-height: 1.65;
    color: #E6EDF3;
    background: #0D1117;
    -webkit-font-smoothing: antialiased;
  }}

  /* ── COVER PAGE ── */
  .cover {{
    page-break-after: always;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 3cm 2cm;
    background: linear-gradient(160deg, #0D1117 0%, #161B22 40%, #0D1117 100%);
    position: relative;
    overflow: hidden;
  }}

  .cover::before {{
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 40%, rgba(88, 166, 255, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(248, 81, 73, 0.04) 0%, transparent 50%);
  }}

  .cover-badge {{
    display: inline-block;
    background: rgba(88, 166, 255, 0.12);
    border: 1px solid rgba(88, 166, 255, 0.25);
    color: #58A6FF;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 6px 20px;
    border-radius: 20px;
    margin-bottom: 30px;
    position: relative;
  }}

  .cover-title {{
    font-size: 36pt;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 10px;
    position: relative;
  }}

  .cover-title span {{
    background: linear-gradient(135deg, #58A6FF 0%, #8E32E9 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }}

  .cover-subtitle {{
    font-size: 14pt;
    color: #8B949E;
    font-weight: 400;
    margin-bottom: 50px;
    position: relative;
  }}

  .cover-divider {{
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #58A6FF, #8E32E9);
    border-radius: 2px;
    margin: 0 auto 30px;
    position: relative;
  }}

  .cover-meta {{
    font-size: 9.5pt;
    color: #8B949E;
    line-height: 2;
    position: relative;
  }}

  .cover-meta strong {{
    color: #E6EDF3;
    font-weight: 600;
  }}

  .cover-url {{
    display: inline-block;
    margin-top: 25px;
    background: rgba(46, 160, 67, 0.1);
    border: 1px solid rgba(46, 160, 67, 0.3);
    color: #2EA043;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 9pt;
    padding: 8px 20px;
    border-radius: 6px;
    position: relative;
  }}

  /* ── MAIN CONTENT ── */
  h1 {{
    font-size: 20pt;
    font-weight: 800;
    color: #FFFFFF;
    margin-top: 35px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid rgba(88, 166, 255, 0.2);
    page-break-after: avoid;
  }}

  h2 {{
    font-size: 15pt;
    font-weight: 700;
    color: #58A6FF;
    margin-top: 28px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 11.5pt;
    font-weight: 600;
    color: #E6EDF3;
    margin-top: 20px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }}

  p {{
    margin-bottom: 10px;
    color: #C9D1D9;
  }}

  strong {{
    color: #E6EDF3;
    font-weight: 600;
  }}

  em {{
    color: #8B949E;
    font-style: italic;
  }}

  /* ── BLOCKQUOTES (Speaker lines) ── */
  blockquote {{
    background: rgba(88, 166, 255, 0.05);
    border-left: 3px solid #58A6FF;
    margin: 14px 0;
    padding: 14px 18px;
    border-radius: 0 8px 8px 0;
    page-break-inside: avoid;
  }}

  blockquote p {{
    color: #E6EDF3;
    font-size: 10pt;
    line-height: 1.7;
    margin-bottom: 8px;
  }}

  blockquote p:last-child {{
    margin-bottom: 0;
  }}

  /* ── LISTS ── */
  ul, ol {{
    margin: 8px 0 12px 24px;
    color: #C9D1D9;
  }}

  li {{
    margin-bottom: 5px;
    padding-left: 4px;
  }}

  li::marker {{
    color: #58A6FF;
  }}

  /* ── CHECKBOX LISTS ── */
  ul li {{
    list-style: none;
    position: relative;
    margin-left: -20px;
    padding-left: 24px;
  }}

  /* ── TABLES ── */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }}

  thead th {{
    background: rgba(88, 166, 255, 0.1);
    color: #58A6FF;
    font-weight: 600;
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid rgba(88, 166, 255, 0.2);
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  tbody td {{
    padding: 9px 12px;
    border-bottom: 1px solid #21262D;
    color: #C9D1D9;
    vertical-align: top;
  }}

  tbody tr:nth-child(even) {{
    background: rgba(22, 27, 34, 0.5);
  }}

  /* ── CODE ── */
  code {{
    font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
    font-size: 8.5pt;
    background: rgba(110, 118, 129, 0.15);
    color: #E6EDF3;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #30363D;
  }}

  pre {{
    background: #161B22;
    border: 1px solid #30363D;
    border-radius: 8px;
    padding: 16px;
    margin: 12px 0;
    overflow-x: auto;
    page-break-inside: avoid;
  }}

  pre code {{
    background: none;
    border: none;
    padding: 0;
    font-size: 8.5pt;
    line-height: 1.5;
    color: #C9D1D9;
  }}

  /* ── HORIZONTAL RULES ── */
  hr {{
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #30363D, transparent);
    margin: 25px 0;
  }}

  /* ── SPECIAL SECTIONS ── */
  .screen-header {{
    background: linear-gradient(135deg, rgba(88, 166, 255, 0.08), rgba(142, 50, 233, 0.05));
    border: 1px solid rgba(88, 166, 255, 0.15);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 18px 0 12px;
  }}

  /* ── LINKS ── */
  a {{
    color: #58A6FF;
    text-decoration: none;
  }}

  /* ── PAGE BREAKS ── */
  h1 {{
    page-break-before: always;
  }}

  h1:first-of-type {{
    page-break-before: avoid;
  }}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-badge">Demo Walkthrough Script</div>
  <div class="cover-title"><span>DrillGuard</span></div>
  <div class="cover-subtitle">Live Demo Walkthrough for Drilling Engineers</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <strong>Presenter:</strong> Okeke Johnpaul Ebube<br>
    <strong>Department:</strong> Petroleum &amp; Gas Engineering<br>
    <strong>University:</strong> University of Lagos<br>
    <strong>Duration:</strong> 15-20 minutes + Q&amp;A<br>
    <div class="cover-url">drill-guard-frontend.vercel.app</div>
  </div>
</div>

<!-- MAIN CONTENT -->
{md_html}

</body>
</html>"""

# Generate PDF
output_path = '/Users/temp-laptop/Developer/Next-Gen-Drilling-Intelligence-AI-Driven-Predictive-Analytics-for-Drilling-Failure/chapters/DrillGuard_Demo_Walkthrough.pdf'
HTML(string=html_content).write_pdf(output_path)
print(f"PDF generated: {output_path}")
