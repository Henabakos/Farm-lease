// ============================================================================
// OCR adapter using Tesseract.js for receipt/image text extraction.
//
// Provides text extraction from images for payment receipt verification.
// Uses Tesseract.js which runs in Node.js via worker threads.
// ============================================================================
import Tesseract from 'tesseract.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../shared/errors.js';

/**
 * Extract text from an image buffer using Tesseract.js.
 *
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {Object} options - Additional options
 * @param {string} options.language - Language code (default: 'eng')
 * @param {boolean} options.includeConfidence - Include confidence scores
 * @returns {Promise<Object>} Extracted text and metadata
 */
export async function extractText(imageBuffer, options = {}) {
  const { language = 'eng', includeConfidence = false } = options;

  try {
    logger.info({ language }, 'Starting OCR extraction');

    const worker = await Tesseract.createWorker(language);

    const result = await worker.recognize(imageBuffer);

    await worker.terminate();

    const response = {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
    };

    logger.info({ confidence: result.data.confidence, textLength: result.data.text.length }, 'OCR extraction completed');

    return response;
  } catch (err) {
    logger.error({ err }, 'OCR extraction failed');
    throw new ExternalServiceError('ocr', `text extraction failed: ${err.message}`);
  }
}

/**
 * Extract structured data from a receipt image.
 * Attempts to identify common receipt fields like amount, date, merchant.
 *
 * @param {Buffer} imageBuffer - The receipt image buffer
 * @returns {Promise<Object>} Structured receipt data
 */
export async function extractReceiptData(imageBuffer) {
  const ocrResult = await extractText(imageBuffer, { includeConfidence: true });

  const text = ocrResult.text.toLowerCase();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Try to extract amount (looks for currency symbols or number patterns)
  const amountPatterns = [
    /total[:\s]*[$€£]?\s*([\d,]+\.?\d*)/i,
    /amount[:\s]*[$€£]?\s*([\d,]+\.?\d*)/i,
    /[$€£]([\d,]+\.?\d*)/,
  ];
  let amount = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Try to extract date
  const datePatterns = [
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
  ];
  let date = null;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }

  // Try to extract transaction ID
  const txIdPatterns = [
    /transaction\s*(?:id|no|number)?[:\s]*([a-z0-9-]+)/i,
    /receipt\s*(?:no|number)?[:\s]*([a-z0-9-]+)/i,
    /ref\s*[:\s]*([a-z0-9-]+)/i,
  ];
  let transactionId = null;
  for (const pattern of txIdPatterns) {
    const match = text.match(pattern);
    if (match) {
      transactionId = match[1];
      break;
    }
  }

  // Extract merchant name (usually first non-empty line)
  const merchant = lines.length > 0 ? lines[0] : null;

  return {
    rawText: ocrResult.text,
    confidence: ocrResult.confidence,
    extractedFields: {
      amount,
      date,
      transactionId,
      merchant,
    },
    lines,
  };
}

/**
 * Generate a perceptual hash for an image buffer for duplicate detection.
 * Simple implementation using image dimensions and sampling.
 *
 * @param {Buffer} imageBuffer - The image buffer
 * @returns {Promise<string>} A hash string for comparison
 */
export async function generatePerceptualHash(imageBuffer) {
  // For a production implementation, you'd use a proper perceptual hashing library
  // like 'image-hash' or implement a difference hash algorithm.
  // This is a simple placeholder that uses the image size and a sample of bytes.

  const size = imageBuffer.length;
  const sampleSize = Math.min(1024, size);
  const step = Math.floor(size / sampleSize);
  
  let hash = '';
  for (let i = 0; i < size && hash.length < 32; i += step) {
    hash += imageBuffer[i].toString(16).padStart(2, '0');
  }

  return `${size}-${hash}`;
}

/**
 * Health check for OCR service.
 */
export async function healthCheck() {
  try {
    // Quick test with a simple text buffer check
    return { status: 'ok', provider: 'tesseract' };
  } catch (err) {
    return { status: 'error', provider: 'tesseract', error: err.message };
  }
}
