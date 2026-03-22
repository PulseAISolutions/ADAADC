import os
from PIL import Image, ImageFilter

def process_images(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".png") or filename.endswith(".jpg"):
            filepath = os.path.join(directory, filename)
            try:
                img = Image.open(filepath).convert("RGBA")
                pixdata = img.load()
                
                width, height = img.size
                modified = False
                
                for y in range(height):
                    for x in range(width):
                        r, g, b, a = pixdata[x, y]
                        # the screenshots have a bright red dotted line from a crop tool
                        # red is typically R > 200, G < 50, B < 50.
                        if r > 150 and g < 70 and b < 70:
                            # make it transparent
                            pixdata[x, y] = (255, 255, 255, 0)
                            modified = True
                            
                if modified:
                    # also apply a slight smooth filter to reduce jagged edges
                    img = img.filter(ImageFilter.SMOOTH)
                    img.save(filepath)
                    print(f"Cleaned {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    process_images(r"d:\ADAADC\assets\merch\items")
