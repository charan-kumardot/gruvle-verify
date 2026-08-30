"""
Resolves whatever the user submitted (URL / pasted text / image / PDF / docx /
multiple files) into plain text for claim extraction, plus whatever side-channel
metadata the report needs (the fetched page for a URL, the image analysis for a
photo). Kept separate from the orchestrator because "how do I turn an upload into
text" and "how do I verify a claim" are different concerns.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.config import Settings
from app.models.schemas import ExtractedContent, ImageAnalysis, InputType
from app.providers.documents.docx_extractor import extract_docx
from app.providers.documents.pdf_extractor import extract_pdf
from app.providers.search.direct_fetch import DirectFetchContentFetcher
from app.providers.vision.router import VisionRouter

DOCX_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")
DOCX_EXTENSIONS = (".docx",)
PDF_EXTENSIONS = (".pdf",)


@dataclass
class ResolvedInput:
    input_type: InputType
    text_for_analysis: str
    subject_url: str | None = None
    primary_content: ExtractedContent | None = None
    image_analysis: ImageAnalysis | None = None
    notes: list[str] = field(default_factory=list)


def _extract_one_file(filename: str, content_type: str, data: bytes, settings: Settings) -> tuple[str, ImageAnalysis | None]:
    lower = filename.lower()
    if lower.endswith(PDF_EXTENSIONS) or content_type == "application/pdf":
        doc = extract_pdf(data)
        return doc.text, None
    if lower.endswith(DOCX_EXTENSIONS) or content_type in DOCX_MIME_TYPES:
        doc = extract_docx(data)
        return doc.text, None
    if lower.endswith(IMAGE_EXTENSIONS) or content_type.startswith("image/"):
        analysis, _degraded = VisionRouter(settings).analyze(data, content_type or "image/png")
        text = "\n".join(filter(None, [analysis.visible_text, analysis.notes]))
        return text, analysis
    return "", None


def resolve_url(url: str, settings: Settings) -> ResolvedInput:
    content = DirectFetchContentFetcher().extract_content(url)
    notes = [content.fetch_error] if content.fetch_error else []
    text = "\n\n".join(filter(None, [content.title, content.text]))
    return ResolvedInput(
        input_type=InputType.URL,
        text_for_analysis=text,
        subject_url=url,
        primary_content=content,
        notes=notes,
    )


def resolve_text(text: str) -> ResolvedInput:
    return ResolvedInput(input_type=InputType.TEXT, text_for_analysis=text)


def resolve_files(files: list[tuple[str, str, bytes]], settings: Settings) -> ResolvedInput:
    """files: list of (filename, content_type, bytes)."""
    texts: list[str] = []
    image_analysis: ImageAnalysis | None = None
    for filename, content_type, data in files:
        text, analysis = _extract_one_file(filename, content_type, data, settings)
        if text:
            texts.append(f"--- {filename} ---\n{text}")
        if analysis is not None:
            image_analysis = analysis

    input_type = InputType.MULTI if len(files) > 1 else (
        InputType.IMAGE if files and (files[0][1].startswith("image/") or files[0][0].lower().endswith(IMAGE_EXTENSIONS))
        else InputType.PDF if files and files[0][0].lower().endswith(PDF_EXTENSIONS)
        else InputType.DOCUMENT
    )
    return ResolvedInput(
        input_type=input_type,
        text_for_analysis="\n\n".join(texts),
        image_analysis=image_analysis,
    )
