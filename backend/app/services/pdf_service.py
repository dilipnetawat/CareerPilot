from fastapi import HTTPException
import pymupdf
from app.config import settings

MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
MIN_EXTRACTED_CHARS = 50


def extract_resume_text(file_bytes: bytes, filename: str = "resume.pdf") -> str:
    """Extract and validate text from a PDF resume in memory using PyMuPDF.

    Performs strict validation against size, page count, encryption, and
    scanned/empty documents. Never stores the file to disk unnecessarily.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty. Please upload a valid PDF resume.",
        )

    if len(file_bytes) > MAX_BYTES:
        size_mb = len(file_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File size ({size_mb:.1f} MB) exceeds the maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Check PDF magic bytes (%PDF-)
    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. The uploaded file does not appear to be a valid PDF document.",
        )

    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read PDF document: {str(exc)}",
        )

    try:
        if doc.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is encrypted or password-protected. Please upload an unencrypted resume.",
            )

        page_count = len(doc)
        if page_count == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF has 0 pages.",
            )

        if page_count > settings.MAX_PDF_PAGES:
            raise HTTPException(
                status_code=400,
                detail=f"The uploaded PDF has {page_count} pages, which exceeds the allowed maximum of {settings.MAX_PDF_PAGES} pages.",
            )

        extracted_text_blocks = []
        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text().strip()
            if page_text:
                extracted_text_blocks.append(page_text)

        full_text = "\n\n".join(extracted_text_blocks).strip()

        # Reject scanned or empty PDFs
        if len(full_text) < MIN_EXTRACTED_CHARS:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The uploaded PDF contains no readable text. It appears to be a scanned image "
                    "or lacks a selectable text layer. CareerPilot AI requires a PDF with selectable text."
                ),
            )

        return full_text

    finally:
        doc.close()
