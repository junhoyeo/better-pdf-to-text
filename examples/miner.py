from pdfminer.high_level import extract_text

# wip
# KSCms-UHC-H encoding etc
text = extract_text("examples/.pdf")
print(text)
