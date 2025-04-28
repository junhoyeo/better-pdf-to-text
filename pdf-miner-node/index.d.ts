/**
 * Extract text from a PDF file using the Python pdfminer library
 * @param pdfPath - Path to the PDF file
 * @returns Promise containing the extracted text
 */
export function extractTextFromFile(pdfPath: string): Promise<string>; 