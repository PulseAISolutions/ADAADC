import fitz
import os

os.makedirs('assets/merch/items', exist_ok=True)
doc = fitz.open('ADA MERCH.pdf')
img_idx = 0

for i in range(1, len(doc)):  # skip cover page 0 if it is one
    page = doc[i]
    image_list = page.get_images(full=True)
    print(f"Page {i+1} has {len(image_list)} images")
    
    for img in image_list:
        xref = img[0]
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        
        # Only save reasonably sized images to avoid background noise/tiny icons
        if pix.width > 100 and pix.height > 100:
            pix.save(f"assets/merch/items/item_{i}_{img_idx}.png")
            img_idx += 1
        pix = None

print(f"Extracted {img_idx} decent sized images.")
