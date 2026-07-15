from PIL import Image
import os

input_path = r"C:\Users\uikey\.gemini\antigravity-ide\brain\59bf6121-1a09-4a5d-85c5-e065a40d505b\google_veo_3_1783920116480.png"
output_dir = r"c:\Users\uikey\OneDrive\Desktop\Master Folder\Lochitra\public\static\images\blog"
output_path = os.path.join(output_dir, "google-veo-3-review.webp")

os.makedirs(output_dir, exist_ok=True)

try:
    with Image.open(input_path) as img:
        target_width = 1200
        target_height = 630
        img_ratio = img.width / img.height
        target_ratio = target_width / target_height
        
        if img_ratio > target_ratio:
            new_width = int(target_ratio * img.height)
            left = (img.width - new_width) / 2
            top = 0
            right = (img.width + new_width) / 2
            bottom = img.height
        else:
            new_height = int(img.width / target_ratio)
            left = 0
            top = (img.height - new_height) / 2
            right = img.width
            bottom = (img.height + new_height) / 2
            
        img = img.crop((left, top, right, bottom))
        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        img.save(output_path, "WEBP", quality=85)
        print(f"Successfully saved {output_path}")
except Exception as e:
    print(f"Error: {e}")
