import re

mapping = {
    # Page 1 - Extracted via Pixmap
    "item_0_0.png": ("Azkals Legacy in White (Cotton)", 950),
    "item_0_1.png": ("Azkals Legacy in Black (Cotton)", 950),
    "item_0_2.png": ("Azkals Legacy Hoodie", 1500),
    "item_0_3.png": ("Azkals Legacy in Blue (Cotton)", 950),

    # Page 2 - Sublimation / Coaches End
    "item_1_0.png": ("Azkals Legacy 1 (Sublimation)", 800),
    "item_1_1.png": ("Azkals Legacy 2 (Sublimation)", 800),
    "item_1_2.png": ("Coaches Full Kit", 1300),
    "item_1_3.png": ("Coaches Kit (Top only)", 800),
    
    # Page 3 - Basic Colors
    "item_2_4.png": ("Azkals Jersey (White)", 800),
    "item_2_5.png": ("Azkals Jersey (Blue)", 800),
    "item_2_6.png": ("Azkals Jersey (Black, Green & Yellow)", 800),
    "item_2_7.png": ("Azkals Jersey (Red)", 800),
    
    # Page 4 - Patterns
    "item_3_8.png": ("Azkals Jersey (Cream)", 800),
    "item_3_9.png": ("Azkals Jersey (Dark Blue)", 800),
    "item_3_10.png": ("Azkals Jersey (Black, Red & Blue)", 800),
    "item_3_11.png": ("Azkals Jersey (Blue & Pink)", 800),
    
    # Page 5 - Socks
    "item_4_12.png": ("Cut Socks in White", 300),
    "item_4_13.png": ("Cut Socks in Red", 300),
    "item_4_14.png": ("Cut Socks in Blue", 300),
    "item_4_15.png": ("Cut Socks in Black", 300),
}

html = '<div class="merch-grid" id="merch-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 30px; padding: 40px 0;">\n'

for img, (title, price) in mapping.items():
    bg_style = 'background: #000; ' if not img.startswith('item_0_') else 'background: #f8f9fa; '
    
    html += f'''
        <div class="merch-item" style="border: 1px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; text-align: center; background: white; box-shadow: var(--shadow-sm); transition: transform 0.2s; display: flex; flex-direction: column;">
          <div style="{bg_style} padding: 10px; display: flex; align-items: center; justify-content: center; height: 260px;">
            <img src="./assets/merch/items/{img}" alt="{title}" style="max-height: 100%; max-width: 100%; object-fit: contain;"/>
          </div>
          <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
            <h3 style="font-size: 1.1rem; color: var(--navy); margin-bottom: 8px; flex-grow: 1; font-weight: 700;">{title}</h3>
            <p style="font-weight: 800; color: var(--red); margin-bottom: 20px; font-size: 1.25rem;">₱{price.toLocaleString() if type(price)==int else price}</p>
            <button type="button" class="btn-primary btn-add-cart" data-id="{img}" data-name="{title}" data-price="{price}" data-img="./assets/merch/items/{img}" style="padding: 12px; font-size: 0.95rem; width: 100%; border:none; cursor:pointer; font-weight: bold; background: var(--navy);">Add to Cart</button>
          </div>
        </div>'''

html += '\n      </div>'

# Add Sizing Charts at the bottom
html += '''
      <div style="margin-top: 60px; text-align: center;">
        <h3 style="color: var(--navy); margin-bottom: 30px; font-size: 1.5rem; font-weight: 800;">Sizing Guide</h3>
        <div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap;">
            <img src="./assets/merch/items/item_5_16.png" style="max-width: 100%; max-height: 600px; height: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);"/>
            <img src="./assets/merch/items/item_6_17.png" style="max-width: 100%; max-height: 600px; height: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);"/>
        </div>
      </div>
'''

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we rip out the entirety of the old Merch Grid and any redundant "Order Now" botton beneath it.
pattern = re.compile(r'<!-- Merch Grid -->.*?(?:Order Now &rarr;</a>\s*</div>|Sizing Guide</h3>.*?</div>\s*</div>)', re.DOTALL)
new_content = pattern.sub('<!-- Merch Grid -->\n' + html, content, count=1)

# Fallback block just in case regex didn't match the old redundant button correctly
if 'Order Now &rarr;</a>' in new_content:
    new_content = re.sub(r'<div style="text-align: center; margin-top: 40px;">\s*<a href="#contact" class="btn-primary">Order Now &rarr;</a>\s*</div>', '', new_content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed exactly.")
