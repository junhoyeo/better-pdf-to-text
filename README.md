# better-pdf-to-text

- Super goated pdf text miner
- Not published to any registry yet
- OCR support added for scanned PDFs using Tesseract.js
- TODO: Add ~~Vision,~~ OCR Correction using LLM, etc., like in [junhoyeo/BetterOCR](https://github.com/junhoyeo/BetterOCR)

## packages

- **`pdf-extract-node`**: Node.js binding for [darxkies/pdf-extract](https://github.com/darxkies/pdf-extract) (fork of [jrmuizel/pdf-extract](https://github.com/jrmuizel/pdf-extract) with better error handling) powered by [napi-rs](https://github.com/napi-rs/node-rs)
- **`pdf-miner-node`**: Node.js wrapper around [pdfminer/pdfminer.six](https://github.com/pdfminer/pdfminer.six) using [node-gyp](https://github.com/nodejs/node-gyp)
- **`core`**: Package that combines both extraction methods with fallback support

## Setup

```bash
# Install dependencies
yarn install

# Build all packages
yarn build
```

## Usage

### Standard text extraction
```ts
import { extractTextFromPDF } from 'pdf-extract-core';

const main = async () => {
  const filePath = 'path/to/your/document.pdf';
  
  try {
    const text = await extractTextFromPDF(filePath);
    console.log(text);
  } catch (error) {
    console.error('Failed to extract text:', error);
  }
};

main();
```

```bash
PDF_PATH=path/to/scanned.pdf yarn start
```

### OCR for scanned PDFs
```bash
# Extract text from scanned PDFs using OCR
PDF_PATH=path/to/scanned.pdf MAX_PAGES=321 yarn ocr
```
