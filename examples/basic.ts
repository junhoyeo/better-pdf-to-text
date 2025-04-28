import { extractTextFromFileAsync } from '../index';
import path from 'path';
import clipboard from 'clipboardy';
import { readdir, mkdir, rm, writeFile, readFile } from 'fs/promises';
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

// 새로 추가: Python 스크립트를 사용하여 PDF에서 텍스트 추출
const extractWithPython = async (pdfPath: string): Promise<string> => {
  const tempDir = path.join(__dirname, 'temp');
  const outputFile = path.join(tempDir, `${path.basename(pdfPath, '.pdf')}_python_output.txt`);
  
  try {
    const execPromise = util.promisify(exec);
    await execPromise(`python3 ${path.join(__dirname, 'miner.py')} "${pdfPath}" "${outputFile}"`);
    
    if (existsSync(outputFile)) {
      const extractedText = await readFile(outputFile, 'utf-8');
      return extractedText;
    }
    return '';
  } catch (error) {
    console.error(`Error extracting with Python from ${pdfPath}:`, error);
    return '';
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
      
      // 수정: 주 메소드로 텍스트 추출 시도, 실패하면 Python으로 시도
      let contents = '';
      try {
        contents = await extractTextFromFileAsync(processedPath);
        contents = normalizeText(contents);
      } catch (err) {
        console.log(`Failed to extract text using primary method: ${(err as Error).message}`);
        console.log(`Trying backup Python method for ${file}...`);
        
        // Python 백업 메소드로 추출 시도
        contents = await extractWithPython(processedPath);
        
        if (contents) {
          console.log(`Successfully extracted text using Python for ${file}`);
        } else {
          console.log(`Failed to extract text from ${file} with all methods`);
        }
      }
        
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
