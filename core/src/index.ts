import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import util from 'util';
import { exec } from 'child_process';
import { extractTextFromFileAsync } from 'pdf-extract-node';
import { extractTextFromFile as extractWithPython } from 'pdf-miner-node';
import { extractTextFromPDFWithOCR } from '../../ocr';

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
 * Check if extracted text is garbage (CID-encoded or garbled)
 * Returns true if text appears to be unreadable CID output
 */
export const isGarbageText = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return true;
  }
  
  // Count CID patterns like (cid:123)
  const cidPattern = /\(cid:\d+\)/g;
  const cidMatches = text.match(cidPattern);
  if (cidMatches && cidMatches.length > 10) {
    console.log(`[garbage-detection] Found ${cidMatches.length} CID patterns - text is garbage`);
    return true;
  }
  
  // Check ratio of readable vs non-readable characters
  // Korean, English, numbers, common punctuation are considered readable
  const readablePattern = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9\s.,!?;:'"()\-\[\]{}\/\\@#$%^&*+=<>~`]/g;
  const readableMatches = text.match(readablePattern) || [];
  const readableRatio = readableMatches.length / text.length;
  
  // If less than 30% of text is readable, consider it garbage
  if (readableRatio < 0.3) {
    console.log(`[garbage-detection] Readable ratio ${(readableRatio * 100).toFixed(1)}% < 30% - text is garbage`);
    return true;
  }
  
  return false;
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
  const cleanupTemp = async () => {
    const tempDir = path.join(path.dirname(pdfPath), 'temp');
    if (existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  };

  try {
    const processedPath = await preprocessPDF(pdfPath);
    console.log(`Processing: ${processedPath}`);
    
    let extractedText = '';
    let usedMethod = '';
    
    try {
      let contents = await extractTextFromFileAsync(processedPath);
      contents = normalizeText(contents);
      
      if (contents.trim().length > 0 && !isGarbageText(contents)) {
        console.log(`✅ Successfully extracted text using primary method`);
        extractedText = contents;
        usedMethod = 'primary';
      } else {
        throw new Error('Primary method returned empty or garbage text');
      }
    } catch (err) {
      console.log(`Primary method failed: ${(err as Error).message}`);
      console.log(`Trying Python method...`);
      
      try {
        const contents = await extractWithPython(processedPath);
        const normalizedContents = normalizeText(contents || '');
        
        if (normalizedContents.length > 0 && !isGarbageText(normalizedContents)) {
          console.log(`✅ Successfully extracted text using Python`);
          extractedText = normalizedContents;
          usedMethod = 'python';
        } else {
          throw new Error('Python method returned empty or garbage text');
        }
      } catch (pythonErr) {
        console.log(`Python method failed: ${(pythonErr as Error).message}`);
      }
    }
    
    if (!extractedText || isGarbageText(extractedText)) {
      console.log(`⚠️ Text extraction failed or returned garbage, falling back to OCR...`);
      
      const absolutePath = path.resolve(pdfPath);
      const ocrText = await extractTextFromPDFWithOCR(absolutePath);
      
      if (ocrText && ocrText.trim().length > 0) {
        console.log(`✅ Successfully extracted text using OCR`);
        extractedText = normalizeText(ocrText);
        usedMethod = 'ocr';
      } else {
        throw new Error('All extraction methods failed including OCR');
      }
    }
    
    await cleanupTemp();
    console.log(`📄 Extraction complete using ${usedMethod} method`);
    return extractedText;
    
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
