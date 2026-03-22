import os
import shutil
from PIL import Image, ImageFilter

directory = r"d:\ADAADC\assets\merch\items"
backup_dir = r"d:\ADAADC\assets\merch\items_backup"

if not os.path.exists(backup_dir):
    shutil.copytree(directory, backup_dir)

for filename in os.listdir(directory):
    if filename.endswith(".png"):
        filepath = os.path.join(directory, filename)
        try:
            img = Image.open(filepath).convert("RGBA")
            r, g, b, a = img.split()
            
            # 1. Threshold alpha to remove soft fringing
            # Any pixel with alpha < 200 becomes 0, else 255
            a = a.point(lambda p: 255 if p > 150 else 0)
            
            # 2. Erode the alpha channel to chop off the outer boundary (which contains the white halo)
            # MinFilter(3) takes the min value in a 3x3 grid, effectively eroding the white (255) area
            eroded_a = a.filter(ImageFilter.MinFilter(3))
            
            # Erode a second time just to be safe with larger white shooting pixels
            eroded_a = eroded_a.filter(ImageFilter.MinFilter(3))
            
            # 3. Smooth the eroded edge so it's not a harsh pixelated line
            smoothed_a = eroded_a.filter(ImageFilter.SMOOTH_MORE)
            
            # Merge back
            img = Image.merge("RGBA", (r, g, b, smoothed_a))
            img.save(filepath)
            print(f"Cleaned fringing for {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print("Done cleaning all items!")
