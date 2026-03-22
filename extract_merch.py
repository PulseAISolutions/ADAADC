import fitz
import os

os.makedirs('assets/merch', exist_ok=True)
doc = fitz.open('ADA MERCH.pdf')
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    pix.save(f'assets/merch/page_{i+1}.png')
print(f"Extracted {len(doc)} pages")
