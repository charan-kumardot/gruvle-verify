"""
Generates a PDF directly from the structured VerificationResult (not by rendering
the frontend's HTML) — same reasoning as the report-text builders in report.py:
the export should reflect exactly what the deterministic pipeline produced, with
no separate rendering path that could drift from it or introduce its own errors.

Uses reportlab (pure Python, no system libraries) rather than an HTML-to-PDF engine
like WeasyPrint — this project already hit one native-dependency build failure on
Render (pydantic-core needing a Rust toolchain the sandbox doesn't allow); reportlab
avoids that risk entirely for a feature that isn't worth re-litigating deployment
constraints over.
"""
from __future__ import annotations

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

from app.models.schemas import VerificationResult

ACCENT = colors.HexColor("#1e3a5f")
VERIFIED = colors.HexColor("#15803d")
CONTRADICTED = colors.HexColor("#b91c1c")
CAUTION = colors.HexColor("#b45309")
MUTED = colors.HexColor("#57534e")

_VERDICT_COLOR = {
    "VERIFIED": VERIFIED,
    "LIKELY_TRUE": VERIFIED,
    "PARTIALLY_SUPPORTED": CAUTION,
    "MISLEADING": CONTRADICTED,
    "CONTRADICTED": CONTRADICTED,
    "UNVERIFIED": MUTED,
    "INSUFFICIENT_EVIDENCE": MUTED,
    "HIGH_RISK": CONTRADICTED,
}


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("GTitle", parent=base["Title"], fontSize=18, spaceAfter=4, textColor=colors.HexColor("#1c1917")),
        "meta": ParagraphStyle("GMeta", parent=base["Normal"], fontSize=9, textColor=MUTED, spaceAfter=12),
        "h2": ParagraphStyle("GH2", parent=base["Heading2"], fontSize=13, spaceBefore=16, spaceAfter=6, textColor=colors.HexColor("#1c1917")),
        "h3": ParagraphStyle("GH3", parent=base["Heading3"], fontSize=11, spaceBefore=10, spaceAfter=3, textColor=colors.HexColor("#1c1917")),
        "body": ParagraphStyle("GBody", parent=base["Normal"], fontSize=10, leading=14, spaceAfter=6),
        "muted": ParagraphStyle("GMutedBody", parent=base["Normal"], fontSize=9, leading=13, textColor=MUTED, spaceAfter=4),
        "excerpt": ParagraphStyle("GExcerpt", parent=base["Normal"], fontSize=9.5, leading=13, leftIndent=12, textColor=colors.HexColor("#44403c"), spaceAfter=3, fontName="Helvetica-Oblique"),
        "bullet": ParagraphStyle("GBullet", parent=base["Normal"], fontSize=10, leading=14, leftIndent=14, bulletIndent=4, spaceAfter=4),
        "footer": ParagraphStyle("GFooter", parent=base["Normal"], fontSize=8, textColor=MUTED, spaceBefore=16),
    }


def _esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_pdf(result: VerificationResult) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        title=result.title or "Gruvle Verify Report",
    )
    s = _styles()
    story = []

    story.append(Paragraph("GRUVLE VERIFY", ParagraphStyle("Brand", fontSize=9, textColor=ACCENT, spaceAfter=10)))

    verdict_color = _VERDICT_COLOR.get(result.verdict.value, MUTED)
    verdict_label = result.verdict.value.replace("_", " ").title()
    story.append(Paragraph(
        f'<font color="{verdict_color.hexval()}"><b>{_esc(verdict_label)}</b></font>'
        f'  &nbsp;&nbsp;  {result.confidence.overall}% confidence',
        s["body"],
    ))
    story.append(Paragraph(_esc(result.title), s["title"]))
    story.append(Paragraph(
        f"Verified as of {result.confidence.last_verified.strftime('%B %d, %Y')} &middot; "
        f"Mode: {result.mode.value.replace('_', ' ').title()} &middot; "
        f"Evidence strength: {result.confidence.evidence_strength.value}",
        s["meta"],
    ))

    if result.degraded_providers:
        story.append(Paragraph(
            f'<font color="{CAUTION.hexval()}"><b>Note:</b> Some providers used to build this report '
            f'({_esc(", ".join(result.degraded_providers))}) were operating in a fallback or '
            f'degraded state — treat this report with extra caution.</font>',
            s["muted"],
        ))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e7e5e4"), spaceBefore=8, spaceAfter=8))

    story.append(Paragraph("Summary", s["h2"]))
    story.append(Paragraph(_esc(result.summary), s["body"]))

    story.append(Paragraph("Claims", s["h2"]))
    for claim in result.claims:
        status_color = _VERDICT_COLOR.get(claim.status.value, MUTED) if claim.status.value in _VERDICT_COLOR else MUTED
        story.append(Paragraph(
            f'{_esc(claim.text)} '
            f'<font color="{status_color.hexval()}" size="8">[{_esc(claim.status.value.replace("_", " "))}]</font>',
            s["h3"],
        ))
        if claim.rationale:
            story.append(Paragraph(_esc(claim.rationale), s["muted"]))

        evidence_ids = claim.evidence_for + claim.evidence_against + claim.evidence_context
        sources_by_id = {src.id: src for src in result.sources}
        for eid in evidence_ids:
            ev = next((e for e in result.evidence if e.id == eid), None)
            if not ev:
                continue
            source = sources_by_id.get(ev.source_id)
            domain = source.domain if source else "unknown source"
            quality = f", quality {source.quality_score}/100" if source else ""
            story.append(Paragraph(
                f'<b>{_esc(ev.relationship.value)}</b> &middot; {_esc(domain)}{quality} &mdash; '
                f'&ldquo;{_esc(ev.excerpt[:300])}&rdquo;',
                s["excerpt"],
            ))

    if result.contradictions:
        story.append(Paragraph("Contradictions detected", s["h2"]))
        for c in result.contradictions:
            story.append(Paragraph(f'&bull; {_esc(c.description)}', s["bullet"]))

    story.append(Paragraph("What's still uncertain?", s["h2"]))
    for q in result.open_questions:
        story.append(Paragraph(f'&bull; {_esc(q)}', s["bullet"]))

    story.append(Paragraph("Recommended next steps", s["h2"]))
    for a in result.next_actions:
        story.append(Paragraph(f'&bull; {_esc(a)}', s["bullet"]))

    if result.sources:
        story.append(Paragraph("Sources", s["h2"]))
        for src in result.sources:
            story.append(Paragraph(f'{_esc(src.title or src.domain)} &mdash; {_esc(src.url)}', s["muted"]))

    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e7e5e4")))
    story.append(Paragraph(
        "This report reflects evidence found automatically and AI reasoning over that evidence "
        "— it is not a guarantee of truth. Open the cited sources yourself before relying on it "
        "for a decision that matters. Generated by Gruvle Verify.",
        s["footer"],
    ))

    doc.build(story)
    return buf.getvalue()
