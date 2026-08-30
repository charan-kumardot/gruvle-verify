"""
Tesseract is the open-source OCR engine used throughout (image analysis fallback,
scanned-PDF text extraction). It requires the `tesseract` binary on PATH, which
pytesseract does not install for you — see backend/README.md for install steps per
OS. When the binary is missing, every caller here degrades to "OCR unavailable"
rather than crashing.
"""
from __future__ import annotations

import io
import logging

logger = logging.getLogger("gruvle.ocr")

_tesseract_checked = False
_tesseract_available = False


def _check_tesseract() -> bool:
    global _tesseract_checked, _tesseract_available
    if _tesseract_checked:
        return _tesseract_available
    _tesseract_checked = True
    try:
        import pytesseract

        pytesseract.get_tesseract_version()
        _tesseract_available = True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Tesseract OCR unavailable: %s", exc)
        _tesseract_available = False
    return _tesseract_available


class TesseractOCR:
    def is_available(self) -> bool:
        return _check_tesseract()

    def extract_from_image_bytes(self, image_bytes: bytes) -> tuple[str, bool]:
        if not self.is_available():
            return "", False
        import pytesseract
        from PIL import Image

        try:
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            return text.strip(), True
        except Exception as exc:  # noqa: BLE001
            logger.warning("OCR extraction failed: %s", exc)
            return "", False
