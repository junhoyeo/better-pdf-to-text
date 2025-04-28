# pdf-extract

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
