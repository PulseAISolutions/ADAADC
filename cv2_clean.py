import os
import cv2
import numpy as np

directory = r"d:\ADAADC\assets\merch\items"

for filename in os.listdir(directory):
    if filename.endswith(".png"):
        filepath = os.path.join(directory, filename)
        
        img = cv2.imread(filepath, cv2.IMREAD_UNCHANGED)
        if img is None or img.shape[2] != 4:
            continue
            
        b, g, r, a = cv2.split(img)
        
        _, mask = cv2.threshold(a, 128, 255, cv2.THRESH_BINARY)
        
        # Find external contours (the solid items)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Draw only significant contours to kill "shooting" speckles
        clean_mask = np.zeros_like(mask)
        for cnt in contours:
            if cv2.contourArea(cnt) > 500:
                cv2.drawContours(clean_mask, [cnt], -1, 255, thickness=cv2.FILLED)
                
        # Open morph to snap off thin spike artifacts attached to the edges
        kernel_open = np.ones((5,5), np.uint8)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_OPEN, kernel_open)
        
        # Erode 2 iterations to shave off the white halo border
        kernel_erode = np.ones((3,3), np.uint8)
        clean_mask = cv2.erode(clean_mask, kernel_erode, iterations=2)
        
        # Soften to prevent jaggedness
        clean_mask = cv2.GaussianBlur(clean_mask, (5, 5), 0)
        
        new_img = cv2.merge([b, g, r, clean_mask])
        cv2.imwrite(filepath, new_img)
        print(f"Deep cleaned {filename}")

print("All done!")
