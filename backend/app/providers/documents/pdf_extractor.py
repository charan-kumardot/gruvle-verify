"""
PDF pipeline: PyMuPDF (fitz) for fast native text extraction; pdfplumber as a
secondary pass for pages that come back empty (common with scanned/image PDFs) by
rasterizing the page and running Tesseract OCR over it. This mirrors the spec's
DOCUMENT -> TEXT EXTRACTION -> OCR IF REQUIRED pipeline.
"""
from __future__ import annotations

import logging

from app.models.schemas import ExtractedDocument
from app.providers.ocr.tesseract_ocr import TesseractOCR

logger = logging.getLogger("gruvle.pdf")


def extract_pdf(file_bytes: bytes) -> ExtractedDocument:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return ExtractedDocument(structure_notes=["PyMuPDF not installed; cannot parse PDF."])

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    ocr = TesseractOCR()
    texts: list[str] = []
    used_ocr = False
    notes: list[str] = []

    for page_index, page in enumerate(doc):
        page_text = page.get_text().strip()
        if len(page_text) < 20 and ocr.is_available():
            pix = page.get_pixmap(dpi=200)
            ocr_text, ok = ocr.extract_from_image_bytes(pix.tobytes("png"))
            if ok and ocr_text:
                page_text = ocr_text
                used_ocr = True
                notes.append(f"Page {page_index + 1}: extracted via OCR (little/no embedded text).")
        elif len(page_text) < 20:
            notes.append(f"Page {page_index + 1}: little/no embedded text and OCR is unavailable — page may be under-represented.")
        texts.append(page_text)

    page_count = doc.page_count
    doc.close()
    return ExtractedDocument(
        text="\n\n".join(texts),
        pages=page_count,
        used_ocr=used_ocr,
        structure_notes=notes,
    )
