import os
import re

items = sorted([f for f in os.listdir('assets/merch/items') if f.endswith('.png')])

html = '<div class="merch-grid" id="merch-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; padding: 40px 0;">\n'

titles = [
    "Azkals Sublimation Kit", "Azkals Legacy 2", "Coaches Kit", "Coaches Kit (Top Only)",
    "Azkals Jersey (White)", "Azkals Jersey (Blue)", "Azkals Jersey (Black/Green/Yellow)", "Azkals Jersey (Red)",
    "Azkals Jersey (Blue/Pink)", "Azkals Jersey (Black/Red/Blue)", "Azkals Jersey (Dark Blue)", "Azkals Jersey (Cream)",
    "Cut Socks (White)", "Cut Socks (Black)", "Cut Socks (Blue)", "Cut Socks (Red)",
    "ADA Gym Bag", "ADA Water Bottle"
]

for idx, img in enumerate(items):
    price = 300 if "item_4_" in img else (500 if "item_5_" in img or "item_6_" in img else 800)
    title = titles[idx] if idx < len(titles) else f"Official Gear #{idx+1}"
    
    html += f'''
        <div class="merch-item" style="border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 24px; text-align: center; background: white; box-shadow: var(--shadow-sm); transition: transform 0.2s; display: flex; flex-direction: column;">
          <img src="./assets/merch/items/{img}" alt="{title}" style="height: 220px; object-fit: contain; margin-bottom: 16px; width: 100%;"/>
          <h3 style="font-size: 1.1rem; color: var(--navy); margin-bottom: 8px; flex-grow: 1;">{title}</h3>
          <p style="font-weight: bold; color: var(--red); margin-bottom: 20px; font-size: 1.1rem;">₱{price}</p>
          <button type="button" class="btn-primary btn-add-cart" data-id="{img}" data-name="{title}" data-price="{price}" data-img="./assets/merch/items/{img}" style="padding: 10px 20px; font-size: 0.95rem; width: 100%; border:none; cursor:pointer;">Add to Cart</button>
        </div>'''

html += '\n      </div>'

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace everything from <!-- Merch Grid --> to <div style="text-align: center; margin-top: 40px;">
pattern = re.compile(r'<!-- Merch Grid -->.*?<div style="text-align: center; margin-top: 40px;">', re.DOTALL)
new_content = pattern.sub('<!-- Merch Grid -->\n' + html + '\n      <div style="text-align: center; margin-top: 40px;">', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected 18 merch items into index.html")
