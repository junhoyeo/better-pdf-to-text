import { extractTextFromFileAsync } from '../index';
import path from 'path';
import clipboard from 'clipboardy';
import { readdir } from 'fs/promises';

const normalizeText = (text: string): string => {
  return text
    .split('\n') 
    .map(line => line.trim()) 
    .filter(line => line.length > 0) 
    .map(line => line.replace(/\s+/g, ' ')) 
    .join('\n'); 
};

const main = async () => {
  const files = await readdir(__dirname);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  console.log(pdfFiles);

  let text = '';
  for (const file of pdfFiles) {
    const filePath = path.join(__dirname, file);
    const contents = await extractTextFromFileAsync(filePath)
      .then(text => normalizeText(text));
      text += contents;
    }
    
  console.log([text]);
  await clipboard.write(text);
};

main().catch(console.error);
