"""PDF text extraction helper (used by Vanguard press-release PDFs and the
SPDR EMEA product-list PDF). Isolated in its own module because pdfplumber
is a heavier, optional dependency -- sources that don't need it never
import this file."""

from __future__ import annotations

import io

from .logging_setup import get_logger

logger = get_logger(__name__)


def _import_pdfplumber():
    # Broad except on purpose: pdfplumber pulls in native/rust extensions
    # (via cryptography/cffi) whose failure modes on a misconfigured
    # system aren't always a clean ImportError. Any failure here just
    # means "PDF parsing unavailable this run", not a crash.
    try:
        import pdfplumber
        return pdfplumber
    except Exception as exc:
        logger.warning("pdfplumber unavailable (%s) -- cannot parse PDF. "
                        "Try: pip install --force-reinstall pdfplumber", exc)
        return None


def extract_pdf_text(pdf_bytes: bytes) -> str | None:
    """Return the concatenated text of every page, or None on failure."""
    pdfplumber = _import_pdfplumber()
    if pdfplumber is None:
        return None

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages_text)
    except Exception as exc:
        logger.warning("Failed to parse PDF: %s", exc)
        return None


def extract_pdf_tables(pdf_bytes: bytes) -> list[list[list[str | None]]]:
    """Return a list of tables (each a list of rows) across all pages.
    Empty list on failure."""
    pdfplumber = _import_pdfplumber()
    if pdfplumber is None:
        return []

    tables: list[list[list[str | None]]] = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                tables.extend(page.extract_tables())
        return tables
    except Exception as exc:
        logger.warning("Failed to parse PDF tables: %s", exc)
        return []
