import re

filepath = r"d:\ADAADC\index.html"
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# CSS to inject
css = """
  <style>
    #merch-grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 40px;
      padding: 60px 0;
    }
    .merch-item {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      flex-direction: column;
      position: relative;
      border: 1px solid rgba(0,0,0,0.04);
    }
    .merch-item:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    .merch-image-container {
      background: linear-gradient(145deg, #111827, #1f2937);
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1 / 1;
      position: relative;
      overflow: hidden;
    }
    .merch-image-container::before {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 150%; height: 150%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
      pointer-events: none;
    }
    .merch-item img {
      max-height: 80%;
      max-width: 80%;
      object-fit: contain;
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.6));
      transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      z-index: 2;
    }
    .merch-item:hover img {
      transform: scale(1.12) rotate(-2deg);
    }
    .merch-details {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      background: white;
    }
    .merch-title {
      font-size: 1.15rem;
      color: var(--navy, #1e293b);
      margin-bottom: 12px;
      flex-grow: 1;
      font-weight: 800;
      line-height: 1.4;
    }
    .merch-price {
      font-weight: 900;
      color: var(--red, #ef4444);
      margin-bottom: 24px;
      font-size: 1.35rem;
    }
    .btn-add-cart {
      padding: 14px;
      font-size: 1rem;
      width: 100%;
      border: none;
      cursor: pointer;
      font-weight: 700;
      background: var(--navy, #1e293b);
      color: white;
      border-radius: 8px;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-add-cart:hover {
      background: var(--red, #ef4444);
    }
    .btn-add-cart:active {
      transform: scale(0.98);
    }
  </style>
"""

# Inject CSS just before the merch grid
html = re.sub(
    r'(<div class="merch-grid" id="merch-grid-container".*?>)',
    lambda m: css + "\n" + m.group(1).replace('style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 30px; padding: 40px 0;"', ''),
    html,
    count=1
)

# Clean up individual items
html = re.sub(
    r'<div class="merch-item" style="border: 1px solid var\(--gray-200\); border-radius: var\(--radius-md\); overflow: hidden; text-align: center; background: white; box-shadow: var\(--shadow-sm\); transition: transform 0\.2s; display: flex; flex-direction: column;">',
    r'<div class="merch-item">',
    html
)

html = re.sub(
    r'<div style="background: #000; padding: 10px; display: flex; align-items: center; justify-content: center; height: 260px;">',
    r'<div class="merch-image-container">',
    html
)

html = re.sub(
    r'(<img src="[^"]+" alt="[^"]+") style="max-height: 100%; max-width: 100%; object-fit: contain;"',
    r'\1',
    html
)

html = re.sub(
    r'<div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">',
    r'<div class="merch-details">',
    html
)

html = re.sub(
    r'<h3 style="font-size: 1\.1rem; color: var\(--navy\); margin-bottom: 8px; flex-grow: 1; font-weight: 700;">(.*?)</h3>',
    r'<h3 class="merch-title">\1</h3>',
    html
)

html = re.sub(
    r'<p style="font-weight: 800; color: var\(--red\); margin-bottom: 20px; font-size: 1\.25rem;">(.*?)</p>',
    r'<p class="merch-price">\1</p>',
    html
)

html = re.sub(
    r'(<button type="button" class="btn-primary btn-add-cart"[^>]+) style="padding: 12px; font-size: 0\.95rem; width: 100%; border:none; cursor:pointer; font-weight: bold; background: var\(--navy\);"',
    r'\1',
    html
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)

print("Applied UI upgrade to index.html successfully.")
