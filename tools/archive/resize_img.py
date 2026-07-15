from PIL import Image, ImageOps
import os

img_path = r"C:\Users\uikey\.gemini\antigravity-ide\brain\67ae933e-7699-4cf7-90cb-3e94b736ceba\pika_review_featured_1783940859320.png"
out_path = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\public\static\images\blog\pika-review.webp"

os.makedirs(os.path.dirname(out_path), exist_ok=True)

img = Image.open(img_path)
img_fit = ImageOps.fit(img, (1200, 630), method=Image.Resampling.LANCZOS)
img_fit.save(out_path, format="WEBP")
print("Image successfully converted and saved to " + out_path)
