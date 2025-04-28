from pdfminer.high_level import extract_text
import sys
import os

# Python script to handle other encodings that pdf-extract doesn't handle, like KSCms-UHC-H

def normalize_text(text):
    """Normalize text similar to the TypeScript function"""
    lines = text.split('\n')
    trimmed_lines = [line.strip() for line in lines]
    filtered_lines = [line for line in trimmed_lines if len(line) > 0]
    processed_lines = [' '.join(line.split()) for line in filtered_lines]
    return '\n'.join(processed_lines)

def extract_pdf_text(pdf_path):
    """Extract text from PDF file and normalize it"""
    try:
        text = extract_text(pdf_path)
        normalized_text = normalize_text(text)
        return normalized_text
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {str(e)}", file=sys.stderr)
        return ""

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python miner.py <pdf_path> <output_path>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    extracted_text = extract_pdf_text(pdf_path)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(extracted_text)
    
    print(f"Text extracted and saved to {output_path}")
