import os
import io
import csv
from typing import Dict, Any, List
import docx
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from app.models.content import GeneratedContent

class ExportService:
    @staticmethod
    def export_markdown(content: GeneratedContent) -> io.BytesIO:
        header = f"# {content.title}\n\n**Platform**: {content.platform}  \n**Status**: {content.status}  \n**Words**: {content.word_count}\n\n---\n\n"
        full = header + content.body
        buffer = io.BytesIO()
        buffer.write(full.encode("utf-8"))
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_txt(content: GeneratedContent) -> io.BytesIO:
        header = f"{content.title}\nPlatform: {content.platform}\nWord Count: {content.word_count}\n\n{'='*40}\n\n"
        full = header + content.body
        buffer = io.BytesIO()
        buffer.write(full.encode("utf-8"))
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_docx(content: GeneratedContent) -> io.BytesIO:
        doc = docx.Document()
        doc.add_heading(content.title, level=0)
        doc.add_paragraph(f"Platform: {content.platform} | Status: {content.status} | Words: {content.word_count}")
        doc.add_paragraph("=" * 30)

        paragraphs = content.body.split("\n\n")
        for p in paragraphs:
            p_strip = p.strip()
            if not p_strip:
                continue
            if p_strip.startswith("### "):
                doc.add_heading(p_strip.replace("### ", ""), level=3)
            elif p_strip.startswith("## "):
                doc.add_heading(p_strip.replace("## ", ""), level=2)
            elif p_strip.startswith("# "):
                doc.add_heading(p_strip.replace("# ", ""), level=1)
            else:
                doc.add_paragraph(p_strip)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_pdf(content: GeneratedContent) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
        styles = getSampleStyleSheet()

        story = []
        title_style = ParagraphStyle("TitleStyle", parent=styles["Heading1"], fontSize=18, leading=22, alignment=TA_CENTER)
        meta_style = ParagraphStyle("MetaStyle", parent=styles["Italic"], fontSize=9, leading=12, alignment=TA_CENTER)
        body_style = ParagraphStyle("BodyStyle", parent=styles["BodyText"], fontSize=10, leading=15, alignment=TA_JUSTIFY)
        h2_style = ParagraphStyle("H2Style", parent=styles["Heading2"], fontSize=14, leading=18, spaceBefore=12, spaceAfter=6)
        h3_style = ParagraphStyle("H3Style", parent=styles["Heading3"], fontSize=12, leading=16, spaceBefore=8, spaceAfter=4)

        story.append(Paragraph(content.title, title_style))
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"Platform: {content.platform} | Words: {content.word_count}", meta_style))
        story.append(Spacer(1, 16))

        for p in content.body.split("\n\n"):
            p_clean = p.strip()
            if not p_clean:
                continue
            # Escape HTML characters for ReportLab Paragraph
            safe_text = p_clean.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if safe_text.startswith("### "):
                story.append(Paragraph(safe_text.replace("### ", ""), h3_style))
            elif safe_text.startswith("## "):
                story.append(Paragraph(safe_text.replace("## ", ""), h2_style))
            elif safe_text.startswith("# "):
                story.append(Paragraph(safe_text.replace("# ", ""), title_style))
            else:
                story.append(Paragraph(safe_text, body_style))
                story.append(Spacer(1, 8))

        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_csv(contents: List[GeneratedContent]) -> io.BytesIO:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["ID", "Title", "Platform", "Content Type", "Status", "Word Count", "Created At"])
        for c in contents:
            writer.writerow([c.id, c.title, c.platform, c.content_type, c.status, c.word_count, str(c.created_at)])
        bytes_buf = io.BytesIO()
        bytes_buf.write(buffer.getvalue().encode("utf-8"))
        bytes_buf.seek(0)
        return bytes_buf

    @staticmethod
    def export_excel(contents: List[GeneratedContent]) -> io.BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Content Library"
        headers = ["ID", "Title", "Platform", "Content Type", "Status", "Word Count", "Created At"]
        ws.append(headers)
        for c in contents:
            ws.append([c.id, c.title, c.platform, c.content_type, c.status, c.word_count, str(c.created_at)])
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer
