import cv2
import numpy as np
import os
from PIL import Image

video_path = r'E:\once\new train.mp4'
output_dir = r'E:\once\images\train_frames'
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
orig_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# First 6 seconds limit
max_6s_frames = min(int(6 * orig_fps), total_video_frames)
target_total_frames = 140

print(f"Processing '{video_path}'...")
print(f"Original FPS: {orig_fps}, Max 6s Frames: {max_6s_frames}")
print(f"Targeting exactly {target_total_frames} WebP frames from first 6 seconds.")

frame_indices = np.linspace(0, max_6s_frames - 1, target_total_frames, dtype=int)

saved_count = 0
for i, frame_idx in enumerate(frame_indices):
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if not ret:
        break
    
    # Convert BGR to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Calculate luminance and RGB components for white background removal
    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)
    lum = (r + g + b) / 3.0
    
    # Create smooth alpha mask
    alpha = np.full_like(lum, 255, dtype=np.uint8)
    
    # White background removal threshold (plain white background)
    # 100% transparent for plain white
    alpha[lum >= 238] = 0
    alpha[(r > 230) & (g > 230) & (b > 230)] = 0
    
    # Anti-aliased smooth transition for soft edges & smoke
    trans_mask = (lum >= 200) & (lum < 238)
    alpha[trans_mask] = ((238 - lum[trans_mask]) / (238 - 200) * 255).astype(np.uint8)
    
    # Stack RGBA channels
    rgba = np.dstack((rgb, alpha))
    
    img = Image.fromarray(rgba, mode='RGBA')
    
    # Save frame as WebP
    filename = f"frame_{saved_count + 1:04d}.webp"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath, format='WEBP', quality=88)
    saved_count += 1

cap.release()
print(f"Successfully exported {saved_count} transparent WebP frames to {output_dir}")
