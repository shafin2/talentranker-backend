import { createRequire } from 'module';

// Use CommonJS require to load pdf-parse (it's a CommonJS module with issues in ES modules)
const require = createRequire(import.meta.url);

/**
 * Extract text content from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text content
 */
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    // Use require instead of import to properly load pdf-parse
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Validate PDF file
 * @param {Object} file - Multer file object
 * @returns {boolean} Is valid PDF
 */
export const validatePDF = (file) => {
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  return true;
};
