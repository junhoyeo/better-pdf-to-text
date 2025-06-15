# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pdf-extract is a robust PDF text extraction library that combines Rust and Python extraction methods with automatic fallback, plus OCR capabilities for scanned documents. It's structured as a Yarn workspace monorepo with three packages:

- `pdf-extract-node`: Rust-based extraction using napi-rs bindings
- `pdf-miner-node`: Python/C++ fallback using pdfminer.six via node-gyp
- `core`: TypeScript orchestration layer with Ghostscript preprocessing
- `ocr.ts`: OCR-based extraction using Tesseract.js for scanned PDFs

## Essential Commands

### Development
```bash
# Install dependencies and build native modules
yarn install

# Build all packages
yarn build

# Run example (requires PDF_PATH environment variable)
PDF_PATH=/path/to/document.pdf yarn start

# Run OCR extraction (for scanned PDFs)
PDF_PATH=/path/to/document.pdf yarn ocr                # Process first 5 pages
PDF_PATH=/path/to/document.pdf MAX_PAGES=10 yarn ocr   # Process first 10 pages
PDF_PATH=/path/to/document.pdf MAX_PAGES=0 yarn ocr    # Process all pages

# Build individual packages
cd pdf-extract-node && yarn build  # Rust build
cd pdf-miner-node && yarn build    # C++ build  
cd core && yarn build              # TypeScript build
```

### Testing
No test commands are currently configured. When adding tests, update this section.

## Architecture

### Extraction Flow
1. `core/src/index.ts` exports `extractTextFromPDF()` as the main API
2. Preprocesses PDF using Ghostscript (`gs` command) for compatibility
3. Attempts extraction with pdf-extract-node (fast Rust method)
4. Falls back to pdf-miner-node if Rust extraction fails (handles complex encodings)
5. Normalizes text output and cleans up temporary files

### OCR Extraction Flow
1. `ocr.ts` exports `extractTextFromPDFWithOCR()` for scanned PDFs
2. Converts PDF pages to PNG images using poppler-utils (`pdftoppm`)
3. Performs OCR on each image using Tesseract.js (supports English and Korean)
4. Outputs are saved in permanent directories (`pdf-ocr-{filename}/`) for inspection
5. Text results are saved to `{filename}_ocr.txt`

### Key Design Decisions
- Dual extraction methods provide robustness for various PDF formats
- Ghostscript preprocessing standardizes PDFs before extraction
- Temporary files are created in OS temp directory and cleaned up after use
- Both sync and async APIs available in pdf-extract-node

### Native Module Integration
- pdf-extract-node: Uses `@napi-rs/cli` for Rust→Node.js binding generation
- pdf-miner-node: Uses node-gyp to wrap Python execution in C++
- Python script path is resolved relative to the built addon location

## Development Requirements

- **Ghostscript**: Must have `gs` command available
- **Python 3**: With `pdfminer.six` package installed
- **Rust toolchain**: For building pdf-extract-node
- **C++ compiler**: For building pdf-miner-node
- **Poppler-utils**: For OCR functionality (install with `brew install poppler` on macOS)
- **Platform**: Currently configured for macOS ARM64 only

## Common Development Tasks

### Adding New Extraction Methods
1. Create new package in workspace
2. Update `core/src/index.ts` to integrate the new method
3. Follow existing pattern of try/catch with fallback

### Debugging Extraction Issues
- Check Ghostscript preprocessing output in temp directory
- Enable verbose logging in pdf-miner-node by modifying Python script
- Test individual extraction methods directly before integration

### Cross-Platform Support
Currently macOS ARM64 only. To add other platforms:
1. Update pdf-extract-node build targets in Cargo.toml
2. Configure node-gyp for target platform in pdf-miner-node
3. Test Ghostscript availability on target platform