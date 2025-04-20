import { extractTextFromFileAsync } from '../index';
import path from 'path';
import clipboard from 'clipboardy';

const normalizeText = (text: string): string => {
  return text
    .split('\n') 
    .map(line => line.trim()) 
    .filter(line => line.length > 0) 
    .map(line => line.replace(/\s+/g, ' ')) 
    .join('\n'); 
};

const main = async () => {
  const filePath = path.join(__dirname, 'example.pdf');
  const text = await extractTextFromFileAsync(filePath)
    .then(text => normalizeText(text));
  console.log(text);

  await clipboard.write(text);
};

main().catch(console.error);
