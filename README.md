## pdf-extract

- Currently a Node.js binding for [darxkies/pdf-extract](https://github.com/darxkies/pdf-extract) (fork of [jrmuizel/pdf-extract](https://github.com/jrmuizel/pdf-extract) with better error handling) powered by [napi-rs](https://github.com/napi-rs/node-rs)
  - Inspired by [scambier/obsidian-text-extractor](https://github.com/scambier/obsidian-text-extractor)
- Not published to any registry yet

```ts
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
```
