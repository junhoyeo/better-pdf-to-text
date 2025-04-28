const { extractText } = require('./build/Release/pdf_miner.node');

/**
 * Extract text from a PDF file using the Python pdfminer library
 * @param {string} pdfPath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromFile = (pdfPath) => {
  return new Promise((resolve, reject) => {
    try {
      const text = extractText(pdfPath);
      resolve(text);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  extractTextFromFile
}; 