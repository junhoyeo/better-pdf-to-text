import { extractTextFromPDF } from './core/src';
import clipboard from 'clipboardy';

const main = async () => {
  const pdfPath = process.env.PDF_PATH;
  if (!pdfPath) {
    throw new Error('PDF_PATH is not set');
  }
  
  try {
    const text = await extractTextFromPDF(pdfPath);
    console.log(text);

    await clipboard.write(text);
  } catch (error) {
    console.error('Failed to extract text:', error);
  }
};

main();
