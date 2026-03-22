import fitz
from PIL import Image
import os

doc = fitz.open('d:\\ADAADC\\ADA MERCH.pdf')

# Render page 1
page = doc[0]
pix = page.get_pixmap(dpi=150)
out_path = 'd:\\ADAADC\\assets\\merch\\items\\page1_full.png'
pix.save(out_path)

img = Image.open(out_path)
w, h = img.size

# Catalog pages usually have header/footer and a 2x2 grid.
# Try to crop it into upper left, upper right, lower left, lower right.
# Let's crop away top 15% and bottom 10%.
top = h * 0.15
bottom = h * 0.90
h_grid = bottom - top

# Crop: left = x=10% to 50%, right = 50% to 90%
w_left = int(w * 0.05)
w_mid = int(w * 0.5)
w_right = int(w * 0.95)

img.crop((w_left, int(top), w_mid, int(top + h_grid/2))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_0.png')
img.crop((w_mid, int(top), w_right, int(top + h_grid/2))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_1.png')
img.crop((w_left, int(top + h_grid/2), w_mid, int(bottom))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_2.png')
img.crop((w_mid, int(top + h_grid/2), w_right, int(bottom))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_3.png')

print("Page 1 cropped into 4 items.")
