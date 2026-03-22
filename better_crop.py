import fitz
from PIL import Image

doc = fitz.open('d:\\ADAADC\\ADA MERCH.pdf')
pix = doc[0].get_pixmap(dpi=300)
out_path = 'd:\\ADAADC\\assets\\merch\\items\\page1_full_highres.png'
pix.save(out_path)

img = Image.open(out_path)
w, h = img.size

top = h * 0.13
bottom = h * 0.90
h_grid = bottom - top

q_h = h_grid / 2

# Cropping the middle 60% vertically (0.20 to 0.80) to avoid text
crop_top1 = top + q_h * 0.20
crop_bottom1 = top + q_h * 0.70

crop_top2 = top + q_h + q_h * 0.20
crop_bottom2 = top + q_h + q_h * 0.70

w_left = int(w * 0.05)
w_mid = int(w * 0.5)
w_right = int(w * 0.95)
q_w = w_mid - w_left

crop_left1 = w_left + q_w * 0.15
crop_right1 = w_left + q_w * 0.85

crop_left2 = w_mid + q_w * 0.15
crop_right2 = w_mid + q_w * 0.85

img.crop((int(crop_left1), int(crop_top1), int(crop_right1), int(crop_bottom1))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_0.png')
img.crop((int(crop_left2), int(crop_top1), int(crop_right2), int(crop_bottom1))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_1.png')

# Swapping the designations to match the mapping logically
# We assume bottom left was Blue shirt and bottom right was Hoodie
img.crop((int(crop_left1), int(crop_top2), int(crop_right1), int(crop_bottom2))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_3.png') 
img.crop((int(crop_left2), int(crop_top2), int(crop_right2), int(crop_bottom2))).save('d:\\ADAADC\\assets\\merch\\items\\item_0_2.png')

print("Cropped page 1 tightly to isolate images.")
