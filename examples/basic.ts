import { extractTextFromFileAsync } from '../index';
import path from 'path';
import clipboard from 'clipboardy';
import { readdir, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import util from 'util';
import { exec } from 'child_process';

const normalizeText = (text: string): string => {
  return text
    .split('\n') 
    .map(line => line.trim()) 
    .filter(line => line.length > 0) 
    .map(line => line.replace(/\s+/g, ' ')) 
    .join('\n'); 
};

const preprocessPDF = async (inputPath: string): Promise<string> => {
  const tempDir = path.join(__dirname, 'temp');
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  
  const fileName = path.basename(inputPath);
  const outputPath = path.join(tempDir, `converted_${fileName}`);
  
  try {
    // Use Ghostscript to convert the PDF to a standard format
    const execPromise = util.promisify(exec);
    await execPromise(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/default -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`);
    return outputPath;
  } catch (error) {
    console.error(`Error preprocessing ${fileName}:`, error);
    return inputPath; // Return original path if conversion fails
  }
};

const main = async () => {
  const files = await readdir(__dirname);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  console.log(pdfFiles);

  const tempDir = path.join(__dirname, 'temp');
  if (existsSync(tempDir)) {
    await rm(tempDir, { recursive: true, force: true });
    await mkdir(tempDir, { recursive: true });
  } else {
    await mkdir(tempDir, { recursive: true });
  }

  let text = '';
  for (const [index, file] of pdfFiles.entries()) {
    console.log(`[${index}/${pdfFiles.length}] ${file}`);
    const filePath = path.join(__dirname, file);
    
    try {
      // Preprocess the PDF first
      const processedPath = await preprocessPDF(filePath);
      console.log(`Processing: ${processedPath}`);
      
      // Try to extract text from the processed PDF
      const contents = await extractTextFromFileAsync(processedPath)
        .then(text => normalizeText(text))
        .catch((err: Error) => {
          console.log(`Failed to extract text from ${file}: ${err.message}`);
          return '';
        });
        
      text += contents;
      
      // Clean up if it's not the original file
      if (processedPath !== filePath && existsSync(processedPath)) {
        // Optional: remove each processed file after extraction
        // await rm(processedPath);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.log(`Error processing ${file}: ${error.message}`);
      continue;
    }
  }
    
  console.log([text]);
  await clipboard.write(text);
  
  // Clean up temp directory at the end
  if (existsSync(tempDir)) {
    await rm(tempDir, { recursive: true, force: true });
  }
};

main().catch(console.error);
