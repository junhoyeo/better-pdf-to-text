import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function extractTextFromPDFWithOCR(pdfPath: string, maxPages?: number): Promise<string> {
  // Create a permanent directory for images based on PDF filename
  const pdfBaseName = path.basename(pdfPath, '.pdf');
  const outputDir = path.join('.', `pdf-ocr-${pdfBaseName}`);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Using output directory: ${outputDir}`);
  
  try {
    // Get PDF info to know how many pages we have
    console.log('Getting PDF info...');
    let pageCount = 0;
    try {
      const { stdout } = await execAsync(`pdfinfo "${pdfPath}" | grep "Pages:" | awk '{print $2}'`);
      pageCount = parseInt(stdout.trim());
      console.log(`PDF has ${pageCount} pages`);
    } catch (error) {
      console.error('Error getting PDF info:', error);
      throw error;
    }
    
    if (pageCount === 0) {
      throw new Error('Could not determine page count from PDF');
    }
    
    const pagesToProcess = maxPages ? Math.min(pageCount, maxPages) : pageCount;
    console.log(`Converting ${pagesToProcess} of ${pageCount} pages to images...`);
    
    // Convert pages to images using command line
    try {
      const outputPath = path.join(outputDir, 'page');
      const pageRange = maxPages ? `-f 1 -l ${maxPages}` : '';
      await execAsync(`pdftoppm -png ${pageRange} "${pdfPath}" "${outputPath}"`);
      console.log('PDF conversion complete');
      
      // Rename files to match expected pattern
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        if (file.match(/^page-\d+\.png$/)) {
          const pageNum = file.match(/\d+/)?.[0];
          if (pageNum) {
            const oldPath = path.join(outputDir, file);
            const newPath = path.join(outputDir, `page-${parseInt(pageNum)}.png`);
            if (oldPath !== newPath) {
              fs.renameSync(oldPath, newPath);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error converting PDF:', error);
      throw error;
    }
    
    // Initialize Tesseract worker with English and Korean
    console.log('Initializing Tesseract worker...');
    const worker = await createWorker('eng+kor', 1, {
      logger: (m: any) => console.log('[Tesseract]', m.status, m.progress)
    });
    console.log('Tesseract worker initialized');
    
    console.log('Starting OCR process...');
    
    // Process each page
    const extractedTexts: string[] = [];
    
    for (let i = 1; i <= pagesToProcess; i++) {
      const imagePath = path.join(outputDir, `page-${i}.png`);
      
      if (fs.existsSync(imagePath)) {
        console.log(`Processing page ${i}/${pagesToProcess}...`);
        
        try {
          const { data: { text } } = await worker.recognize(imagePath);
          extractedTexts.push(`--- Page ${i} ---\n${text}`);
        } catch (error) {
          console.error(`Error processing page ${i}:`, error);
          extractedTexts.push(`--- Page ${i} ---\n[OCR Error]`);
        }
      }
    }
    
    await worker.terminate();
    
    // Combine all text
    const fullText = extractedTexts.join('\n\n');
    
    return fullText;
    
  } finally {
    // No cleanup - keeping files for inspection
    console.log(`Output files kept in: ${outputDir}`);
  }
}

// Check if poppler is installed
async function checkPopplerInstalled(): Promise<boolean> {
  try {
    await execAsync('which pdfinfo');
    return true;
  } catch {
    return false;
  }
}

// Main function
async function main() {
  const pdfPath = process.argv[2] || process.env.PDF_PATH;
  
  if (!pdfPath) {
    console.error('Please provide a PDF file path as argument or set PDF_PATH environment variable');
    console.error('Usage: tsx ocr.ts <pdf-file-path>');
    console.error('   or: PDF_PATH=<pdf-file-path> tsx ocr.ts');
    process.exit(1);
  }
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found: ${pdfPath}`);
    process.exit(1);
  }
  
  try {
    // Check if poppler is installed
    const popplerInstalled = await checkPopplerInstalled();
    if (!popplerInstalled) {
      console.error('Error: poppler-utils is not installed.');
      console.error('Please install it first:');
      console.error('  macOS: brew install poppler');
      console.error('  Ubuntu/Debian: sudo apt-get install poppler-utils');
      console.error('  RHEL/CentOS: sudo yum install poppler-utils');
      process.exit(1);
    }
    
    // Parse max pages from environment variable or default to 5 for testing
    const maxPages = process.env.MAX_PAGES ? parseInt(process.env.MAX_PAGES) : 5;
    
    console.log(`Starting OCR extraction from: ${pdfPath}`);
    if (maxPages) {
      console.log(`Processing up to ${maxPages} pages (set MAX_PAGES env var to change)`);
    }
    const text = await extractTextFromPDFWithOCR(pdfPath, maxPages);
    
    console.log('\n=== Extracted Text ===\n');
    console.log(text);
    
    // Save to file
    const outputPath = pdfPath.replace('.pdf', '_ocr.txt');
    fs.writeFileSync(outputPath, text);
    console.log(`\nText saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error during OCR extraction:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

export { extractTextFromPDFWithOCR };