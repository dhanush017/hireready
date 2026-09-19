"""PDF text extraction using pypdf."""

from __future__ import annotations

import base64
import io

from pypdf import PdfReader


class PDFExtractionError(Exception):
    """Raised when PDF text extraction fails."""
    pass


def extract_text_from_base64(pdf_base64: str) -> str:
    """Extract text from a base64-encoded PDF.

    Args:
        pdf_base64: Base64-encoded PDF content.

    Returns:
        Extracted text from all pages.

    Raises:
        PDFExtractionError: If the PDF is invalid or empty.
    """
    try:
        pdf_bytes = base64.b64decode(pdf_base64)
    except Exception as e:
        raise PDFExtractionError(f"Invalid base64 encoding: {e}")

    if len(pdf_bytes) == 0:
        raise PDFExtractionError("Empty PDF file")

    if len(pdf_bytes) > 2 * 1024 * 1024:
        raise PDFExtractionError("PDF exceeds 2 MB size limit")

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as e:
        raise PDFExtractionError(f"Could not read PDF: {e}")

    if len(reader.pages) == 0:
        raise PDFExtractionError("PDF has no pages")

    text_parts: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    full_text = "\n".join(text_parts).strip()

    if not full_text:
        raise PDFExtractionError(
            "Could not extract text from PDF. The file may be image-based or empty."
        )

    return full_text
