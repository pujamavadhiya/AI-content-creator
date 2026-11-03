import os
import ipaddress
import socket
from urllib.parse import urlparse
from typing import Dict, Any, List
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
import docx
import openpyxl

class ParserService:
    @staticmethod
    def parse_pdf(file_path: str) -> List[Dict[str, Any]]:
        """Extract text from PDF page by page."""
        reader = PdfReader(file_path)
        pages = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page_number": idx + 1, "text": text.strip()})
        return pages

    @staticmethod
    def parse_docx(file_path: str) -> List[Dict[str, Any]]:
        """Extract text from DOCX."""
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        return [{"page_number": 1, "text": "\n\n".join(full_text)}]

    @staticmethod
    def parse_excel(file_path: str) -> List[Dict[str, Any]]:
        """Extract text from Excel worksheets."""
        wb = openpyxl.load_workbook(file_path, data_only=True)
        text_lines = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            text_lines.append(f"--- Sheet: {sheet_name} ---")
            for row in ws.iter_rows(values_only=True):
                row_vals = [str(v).strip() for v in row if v is not None]
                if row_vals:
                    text_lines.append(" | ".join(row_vals))
        return [{"page_number": 1, "text": "\n".join(text_lines)}]

    @staticmethod
    def parse_text_file(file_path: str) -> List[Dict[str, Any]]:
        """Extract text from TXT or Markdown files."""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return [{"page_number": 1, "text": content.strip()}]

    @staticmethod
    async def parse_url(url: str) -> List[Dict[str, Any]]:
        """
        Fetch and parse public web URL with strict SSRF defense.
        Prevents access to private subnets, localhost, and cloud metadata.
        """
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Only http and https protocols are permitted")
        
        hostname = parsed.hostname
        if not hostname:
            raise ValueError("Invalid URL hostname")

        # Resolve IP to protect against SSRF (internal networks & cloud metadata)
        try:
            ip_str = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local:
                raise ValueError("Access to internal, loopback, or metadata endpoints is restricted")
        except socket.gaierror:
            raise ValueError(f"Could not resolve domain: {hostname}")

        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; SevencoreContentIntelligence/1.0; +https://sevencore.ai)"
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code >= 400:
                raise ValueError(f"Target URL returned error HTTP {resp.status_code}")

            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove navigation, scripts, styles, ads
            for elem in soup(["script", "style", "nav", "footer", "header", "noscript", "aside"]):
                elem.extract()

            # Prefer main article body if available
            article = soup.find("article") or soup.find("main") or soup.find("body")
            raw_text = article.get_text(separator="\n\n") if article else soup.get_text(separator="\n\n")

            # Clean blank lines
            lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
            cleaned_text = "\n\n".join(lines)

            title = soup.title.string.strip() if soup.title and soup.title.string else hostname
            return [{
                "page_number": 1,
                "title": title,
                "text": cleaned_text[:30000]  # Cap to reasonable size
            }]

    @classmethod
    async def extract_file_content(cls, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Dispatch extractor based on file extension / type."""
        ext = file_type.lower().strip().replace(".", "")
        if ext == "pdf":
            return cls.parse_pdf(file_path)
        elif ext in ("docx", "doc"):
            return cls.parse_docx(file_path)
        elif ext in ("xlsx", "xls"):
            return cls.parse_excel(file_path)
        elif ext in ("txt", "md", "markdown"):
            return cls.parse_text_file(file_path)
        else:
            return cls.parse_text_file(file_path)

