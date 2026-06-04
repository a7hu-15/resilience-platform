from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from datetime import datetime

GREEN  = HexColor('#00ff88')
DARK   = HexColor('#1a1a1a')
DARKER = HexColor('#111111')
GRAY   = HexColor('#888888')
WHITE  = HexColor('#ffffff')
RED    = HexColor('#ff4444')
YELLOW = HexColor('#ffaa00')
LIME   = HexColor('#88ff00')

def generate_report(job_id, docker_image, test_results, scores):
    path = f"/tmp/report-{job_id}.pdf"

    doc = SimpleDocTemplate(path, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    title_style  = ParagraphStyle('T', parent=styles['Title'], fontSize=24, textColor=GREEN, spaceAfter=6, alignment=TA_CENTER)
    sub_style    = ParagraphStyle('S', parent=styles['Normal'], fontSize=11, textColor=GRAY, spaceAfter=16, alignment=TA_CENTER)
    h2_style     = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, textColor=WHITE, spaceBefore=14, spaceAfter=6)
    body_style   = ParagraphStyle('B', parent=styles['Normal'], fontSize=10, textColor=HexColor('#cccccc'), spaceAfter=6, leading=16)
    bullet_style = ParagraphStyle('BU', parent=styles['Normal'], fontSize=10, textColor=HexColor('#cccccc'), spaceAfter=4, leading=16, leftIndent=20)

    grade_color = HexColor(scores.get('grade_color', '#00ff88'))
    story = []

    # Header
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("Resilience Test Report", title_style))
    story.append(Paragraph(f"Image tested: {docker_image}", sub_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Spacer(1, 0.2*inch))

    # Overall Score
    story.append(Paragraph("Overall Resilience Score", h2_style))
    score_data = [
        [f"{scores.get('overall', 0)}/100", f"Grade: {scores.get('grade','?')} — {scores.get('grade_label','')}" ],
    ]
    score_table = Table(score_data, colWidths=[2*inch, 4.5*inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARKER),
        ('TEXTCOLOR', (0,0), (0,0), grade_color),
        ('TEXTCOLOR', (1,0), (1,0), grade_color),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (0,0), 32),
        ('FONTSIZE', (1,0), (1,0), 16),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 16),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#333333')),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 0.2*inch))

    # Score Breakdown
    story.append(Paragraph("Score Breakdown", h2_style))
    breakdown = [
        ["Category", "Score", "Status"],
        ["Self-Healing (Pod Chaos)", f"{scores.get('self_healing', 0)}/100", "PASS" if scores.get('self_healing',0) > 30 else "FAIL"],
        ["CPU Resilience",           f"{scores.get('cpu_resilience', 0)}/100", "PASS" if scores.get('cpu_resilience',0) > 25 else "FAIL"],
        ["Memory Resilience",        f"{scores.get('memory_resilience', 0)}/100", "PASS" if scores.get('memory_resilience',0) > 25 else "FAIL"],
        ["Network Resilience",       f"{scores.get('network_resilience', 0)}/100", "PASS" if scores.get('network_resilience',0) > 20 else "FAIL"],
        ["Packet Resilience",        f"{scores.get('packet_resilience', 0)}/100", "PASS" if scores.get('packet_resilience',0) > 20 else "FAIL"],
        ["Recovery Validation",      f"{scores.get('recovery', 0)}/100", "PASS" if scores.get('recovery',0) > 10 else "FAIL"],
    ]
    bt = Table(breakdown, colWidths=[3*inch, 1.5*inch, 2*inch])
    bt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#003322')),
        ('TEXTCOLOR', (0,0), (-1,0), GREEN),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BACKGROUND', (0,1), (-1,-1), DARK),
        ('TEXTCOLOR', (0,1), (1,-1), WHITE),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#333333')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [DARK, DARKER]),
    ]))
    # Color PASS/FAIL column
    for i, row in enumerate(breakdown[1:], 1):
        color = GREEN if row[2] == "PASS" else RED
        bt.setStyle(TableStyle([('TEXTCOLOR', (2,i), (2,i), color)]))
    story.append(bt)
    story.append(Spacer(1, 0.2*inch))

    # Recovery Times
    story.append(Paragraph("Recovery Times", h2_style))
    keys = ['pod_chaos','cpu_stress','memory_stress','network_delay','packet_loss','recovery_validation']
    names = ['Pod Chaos','CPU Stress','Memory Stress','Network Delay','Packet Loss','Recovery Validation']
    rt_data = [["Test", "Result", "Recovery Time"]]
    for k, n in zip(keys, names):
        r = test_results.get(k, 'FAIL')
        if isinstance(r, dict):
            rt_data.append([n, "PASS", f"{r.get('recovery_time','?')}s"])
        else:
            rt_data.append([n, "FAIL", "—"])
    rtt = Table(rt_data, colWidths=[2.5*inch, 1.5*inch, 2.5*inch])
    rtt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#003322')),
        ('TEXTCOLOR', (0,0), (-1,0), GREEN),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BACKGROUND', (0,1), (-1,-1), DARK),
        ('TEXTCOLOR', (0,1), (0,-1), WHITE),
        ('TEXTCOLOR', (2,1), (2,-1), HexColor('#88ccff')),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#333333')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [DARK, DARKER]),
    ]))
    for i, row in enumerate(rt_data[1:], 1):
        color = GREEN if row[1] == "PASS" else RED
        rtt.setStyle(TableStyle([('TEXTCOLOR', (1,i), (1,i), color)]))
    story.append(rtt)

    story.append(Spacer(1, 0.3*inch))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("Resilience Testing Platform — ZorawarSinghKhan",
        ParagraphStyle('F', parent=styles['Normal'], fontSize=9, textColor=GRAY, alignment=TA_CENTER)))

    doc.build(story)
    return path
