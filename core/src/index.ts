import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import util from 'util';
import { exec } from 'child_process';

// Import from pdf-extract-node package
import { extractTextFromFileAsync } from 'pdf-extract-node';

// Import from pdf-miner-node package
import { extractTextFromFile as extractWithPython } from 'pdf-miner-node';

/**
 * Normalize text by removing excess whitespace and empty lines
 */
export const normalizeText = (text: string): string => {
  return text
    .split('\n') 
    .map(line => line.trim()) 
    .filter(line => line.length > 0) 
    .map(line => line.replace(/\s+/g, ' ')) 
    .join('\n'); 
};

/**
 * Preprocess a PDF file using Ghostscript to improve compatibility
 */
export const preprocessPDF = async (inputPath: string): Promise<string> => {
  const tempDir = path.join(path.dirname(inputPath), 'temp');
  if (!existsSync(tempDir)) {
    await fs.mkdir(tempDir, { recursive: true });
  }
  
  const fileName = path.basename(inputPath);
  const outputPath = path.join(tempDir, `converted_${fileName}`);
  
  try {
    // Use Ghostscript to convert the PDF to a standard format
    const execPromise = util.promisify(exec);
    await execPromise(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/default -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`);
    return outputPath;
  } catch (error) {
    console.error(`[ghostscript] Error preprocessing ${fileName}:`, error);
    return inputPath; // Return original path if conversion fails
  }
};

/**
 * Extract text from a PDF file, trying multiple methods if needed
 */
export const extractTextFromPDF = async (pdfPath: string): Promise<string> => {
  try {
    // Preprocess the PDF first
    const processedPath = await preprocessPDF(pdfPath);
    console.log(`Processing: ${processedPath}`);
    
    try {
      // Try primary method (pdf-extract-node)
      let contents = await extractTextFromFileAsync(processedPath);
      contents = normalizeText(contents);
      console.log(`✅ Successfully extracted text using primary method`);
      
      // Clean up temp directory if created during preprocessing
      const tempDir = path.join(path.dirname(pdfPath), 'temp');
      if (processedPath !== pdfPath && existsSync(tempDir)) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
      
      return contents;
    } catch (err) {
      console.log(`Failed to extract text using primary method: ${(err as Error).message}`);
      console.log(`Trying backup Python method...`);
      
      // Extract text using Python's pdfminer (backup method)
      const contents = await extractWithPython(processedPath);
      
      if (contents) {
        console.log(`✅ Successfully extracted text using Python`);
        
        // Clean up temp directory if created during preprocessing
        const tempDir = path.join(path.dirname(pdfPath), 'temp');
        if (processedPath !== pdfPath && existsSync(tempDir)) {
          await fs.rm(tempDir, { recursive: true, force: true });
        }
        
        return normalizeText(contents);
      } else {
        throw new Error('Failed to extract text with all methods');
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`❌ Error processing PDF: ${error.message}`);
    throw error;
  }
};

export default {
  extractTextFromPDF,
  normalizeText,
  preprocessPDF
}; 