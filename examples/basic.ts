import { extractTextFromFile, extractTextFromFileAsync, extractTextFromBuffer, extractTextFromBufferAsync } from '../index';
import fs from 'fs';
import path from 'path';

const normalizeText = (text: string): string => {
  return text
    .split('\n') // Split by newlines
    .map(line => line.trim()) // Trim each line
    .filter(line => line.length > 0) // Remove empty lines
    .map(line => line.replace(/\s+/g, ' ')) // Replace multiple spaces with single space within each line
    .join('\n'); // Join with newlines
};

const main = async () => {
  const examplePdfPath = path.join(__dirname, 'example.pdf');
  
  // Example 1: Extract text from file
  const textFromFile = extractTextFromFile(examplePdfPath);
  console.log('Extracted text from file:', normalizeText(textFromFile as string));
  
  // Example 2: Extract text from file (async)
  const asyncTextFromFile = await extractTextFromFileAsync(examplePdfPath);
  console.log('Extracted text from file (async):', normalizeText(asyncTextFromFile as string));
  
  // Example 3: Extract text from buffer
  const pdfBuffer = fs.readFileSync(examplePdfPath);
  const textFromBuffer = extractTextFromBuffer(pdfBuffer);
  console.log('Extracted text from buffer:', normalizeText(textFromBuffer as string));
  
  // Example 4: Extract text from buffer (async)
  const asyncTextFromBuffer = await extractTextFromBufferAsync(pdfBuffer);
  console.log('Extracted text from buffer (async):', normalizeText(asyncTextFromBuffer as string));
};

main().catch(console.error);
