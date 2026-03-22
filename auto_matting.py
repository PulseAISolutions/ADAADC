import os
import cv2
import numpy as np

directory = r"d:\ADAADC\assets\merch\items_backup"
out_dir = r"d:\ADAADC\assets\merch\items"

for filename in os.listdir(directory):
    if filename.endswith(".png") or filename.endswith(".jpg"):
        in_path = os.path.join(directory, filename)
        out_path = os.path.join(out_dir, filename)
        
        # Read as standard BGR (3 channels)
        img = cv2.imread(in_path, cv2.IMREAD_COLOR)
        if img is None: continue
        
        # 1. Create a mask of the non-black pixels. The background is 0,0,0.
        # We'll use a threshold: any pixel with intensity > 10 in any channel is "foreground"
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, raw_mask = cv2.threshold(gray, 5, 255, cv2.THRESH_BINARY)
        
        # 2. Find contours. The "shooting white pixels" are tiny floating islands of white.
        # The main shirt/socks will be the largest 1-3 contours.
        contours, _ = cv2.findContours(raw_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        clean_mask = np.zeros_like(raw_mask)
        # Sort contours by area, keep the largest ones. If it's a shirt, it's 1. 
        # If socks, it's 2. Sizing guide might be 1.
        # Just keep any contour larger than 1000 pixels.
        for cnt in contours:
            if cv2.contourArea(cnt) > 2000:
                cv2.drawContours(clean_mask, [cnt], -1, 255, thickness=cv2.FILLED)
                
        # 3. Aggressively erode the mask to shave off the white halo border
        kernel_erode = np.ones((4,4), np.uint8)
        clean_mask = cv2.erode(clean_mask, kernel_erode, iterations=1)
        
        # 4. Blur the mask for a soft anti-aliased edge
        clean_mask = cv2.GaussianBlur(clean_mask, (5, 5), 0)
        
        # 5. Add alpha channel to the original image based on our clean mask
        b, g, r = cv2.split(img)
        new_img = cv2.merge([b, g, r, clean_mask])
        
        cv2.imwrite(out_path, new_img)
        print(f"Auto-matted {filename}")

print("All done!")
