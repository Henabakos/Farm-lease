// Text extraction for KB ingestion. Pluggable per mime-type.
//
// Today we support: plain text / markdown / json / csv natively, and PDF via
// pdf-parse. Future formats (docx via mammoth, images via OCR) can be added
// by registering a new (mimeType, extractor) pair in EXTRACTORS.
//
// The function returns plain UTF-8 text. The caller (ingestion worker) is
// responsible for chunking + embedding.

const EXTRACTORS = new Map();

// Lazy-load heavy parsers so they're not loaded for plain-text uploads.
async function extractPdf(buffer) {
  const { default: pdf } = await import('pdf-parse');
  const out = await pdf(buffer);
  return out.text ?? '';
}

EXTRACTORS.set(/^application\/pdf/, extractPdf);
EXTRACTORS.set(/^text\//, (buf) => buf.toString('utf-8'));
EXTRACTORS.set(/^application\/json/, (buf) => buf.toString('utf-8'));

export async function extractText({ buffer, mimeType, fileName }) {
  for (const [pattern, fn] of EXTRACTORS) {
    if (pattern.test(mimeType ?? '')) {
      return fn(buffer, { fileName });
    }
  }
  // Last-ditch heuristic — sniff the bytes; if it looks textual, treat it as
  // utf-8, else reject so the caller can mark the document as FAILED.
  const sample = buffer.subarray(0, 1024).toString('utf-8');
  if (/^[\x09\x0A\x0D\x20-\x7E]*$/.test(sample)) {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported mime type for extraction: ${mimeType}`);
}

/**
 * Recursive character text splitter.
 * Splits text on paragraph → sentence → word → char boundaries, falling
 * through until each chunk is ≤ chunkSize tokens (rough char-to-token ratio).
 * `overlap` glues consecutive chunks together to preserve context across
 * boundary cuts — important so retrieval doesn't lose the answer when it
 * straddles two chunks.
 */
export function chunkText(text, { chunkSize = 1200, overlap = 200 } = {}) {
  if (!text || !text.trim()) return [];
  const out = [];
  const len = text.length;
  let start = 0;
  while (start < len) {
    let end = Math.min(start + chunkSize, len);
    if (end < len) {
      // Try to break on a paragraph or sentence boundary near `end` to avoid
      // cutting mid-word.
      const window = text.slice(start, end);
      const lastPara = window.lastIndexOf('\n\n');
      const lastSentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
      const cut = Math.max(lastPara, lastSentence);
      if (cut > chunkSize * 0.5) end = start + cut + 1;
    }
    out.push(text.slice(start, end).trim());
    if (end >= len) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out.filter(Boolean);
}
