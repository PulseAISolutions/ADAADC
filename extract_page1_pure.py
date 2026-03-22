import fitz

doc = fitz.open('d:\\ADAADC\\ADA MERCH.pdf')
images = doc[0].get_images()

# The 4 raster images are embedded as 640x640 squares.
# Expected Order: White (0_0), Black (0_1), Blue (0_2), Hoodie (0_3)
names = ['item_0_0.png', 'item_0_1.png', 'item_0_2.png', 'item_0_3.png']

for i, img in enumerate(images):
    if i >= 4: break
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    with open(f"d:\\ADAADC\\assets\\merch\\items\\{names[i]}", "wb") as f:
        f.write(image_bytes)

print("Extracted the 4 pure raster images from Page 1 successfully!")
