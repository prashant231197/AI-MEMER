import os
import sys
import math
import subprocess
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FFMPEG_PATH = r"C:\Users\SUSHANT KUMAR\AppData\Local\Programs\Python\Python313\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENS_DIR = os.path.join(BASE_DIR, "ad_assets", "screens")
AUDIO_DIR = os.path.join(BASE_DIR, "ad_assets", "audio")
MASTER_AUDIO = os.path.join(AUDIO_DIR, "master_audio.wav")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "AI_MEMER_Demo_Hindi.mp4")
OUTPUT_VIDEO_ROOT = os.path.join(os.path.dirname(BASE_DIR), "AI_MEMER_Demo_Hindi.mp4")

W, H = 1920, 1080
FPS = 30
WIN_W, WIN_H = 1760, 790
WIN_X, WIN_Y = (W - WIN_W) // 2, 85

# Load typography
FONT_BRAND = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
FONT_TAG = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 20)
FONT_HEAD = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 34)
FONT_HINDI = ImageFont.truetype(r"C:\Windows\Fonts\Nirmala.ttc", 27)
FONT_SUB = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 20)

# Pre-created rounded mask
MASK_WINDOW = Image.new("L", (WIN_W, WIN_H), 0)
d_mask = ImageDraw.Draw(MASK_WINDOW)
d_mask.rounded_rectangle([0, 0, WIN_W, WIN_H], radius=20, fill=255)

SCENES = [
    {
        "id": 1,
        "duration_sec": 13.0,
        "img": "01_dashboard.png",
        "tag": "⚡ WELCOME TO AI MEMER",
        "head": "Tired of spending hours making Memes & Reels? Meet AI MEMER!",
        "hindi": "क्या आप भी सोशल मीडिया पर वायरल मीम्स और रील्स बनाने में घंटों लगाते हैं? पेश है — AI MEMER!",
    },
    {
        "id": 2,
        "duration_sec": 12.0,
        "img": "02_tech_feed.png",
        "tag": "📰 REAL-TIME GOOGLE NEWS FEEDS",
        "head": "Instant News Feeds • Tech, Business, Entertainment & Sports",
        "hindi": "AI MEMER दुनिया भर की ब्रेकिंग न्यूज़ को रियल-टाइम में फ़ेच करता है — बस एक क्लिक में!",
    },
    {
        "id": 3,
        "duration_sec": 15.0,
        "img": "03_meme_studio.png",
        "tag": "✨ GROQ AI PUNCHLINE STUDIO",
        "head": "7+ Meme Templates • Instant Dark Irony & Savage Viral Punchlines",
        "hindi": "किसी भी हेडलाइन को सेलेक्ट करें, और Groq AI तुरंत तैयार करेगा डार्क ह्यूमर और सेवेज पंचलाइन्स!",
    },
    {
        "id": 4,
        "duration_sec": 13.5,
        "img": "04_reel_studio.png",
        "tag": "🎬 9:16 VIRAL REEL MAKER",
        "head": "Multi-Clip Collab Editor • Dual Split-Screen & PiP Reaction Drop",
        "hindi": "मल्टी-क्लिप कोलैब एडिटिंग, डुअल स्प्लिट-स्क्रीन और वायरल वीडियो मोन्टाज!",
    },
    {
        "id": 5,
        "duration_sec": 14.0,
        "img": "05b_chyron_layout.png",
        "tag": "💎 20 VIRAL PATTERNS + AI CLARITY",
        "head": "Breaking TV Chyron, Satire Cards + AI 1080p Video & Audio Enhancer",
        "hindi": "20 से ज़्यादा वायरल वीडियो पैटर्न्स और AI क्लैरिटी एन्हांसर — 1080p क्रिस्टल-क्लियर क्वालिटी!",
    },
    {
        "id": 6,
        "duration_sec": 13.0,
        "img": "06_batch_selected.png",
        "img2": "06b_instagram_modal.png",
        "tag": "🚀 1-CLICK BATCH AUTOMATION",
        "head": "Select All News ➔ Generate Reels ➔ Auto-Publish to Instagram",
        "hindi": "सिलेक्ट ऑल न्यूज़ पर क्लिक करें, और एक साथ टॉप खबरों की रील्स बनाकर सीधे इंस्टाग्राम पर पोस्ट करें!",
    },
    {
        "id": 7,
        "duration_sec": 10.5,
        "img": "outro",
        "tag": "⚡ CREATE VIRAL CONTENT TODAY",
        "head": "100x Faster Content Creation • Fully Automated Live News to Reels",
        "hindi": "तो देर किस बात की? आज ही अपनाइए AI MEMER, और अपने कंटेंट क्रिएशन को बनाइए 100x तेज़!",
    }
]

# Pre-scale all screenshots once to (1850, 1040) so cropping is instant
CACHED_SCREENS = {}
for s in SCENES:
    for k in ["img", "img2"]:
        if k in s and s[k] != "outro":
            fn = s[k]
            if fn not in CACHED_SCREENS:
                p = os.path.join(SCREENS_DIR, fn)
                if os.path.exists(p):
                    raw = Image.open(p).convert("RGBA")
                    # Pre-scaled to 1850x1040
                    scaled = raw.resize((1850, 1040), Image.Resampling.LANCZOS)
                    CACHED_SCREENS[fn] = scaled

TOTAL_FRAMES = sum(int(s["duration_sec"] * FPS) for s in SCENES)

def render_scene_frame(scene_idx, scene_progress, overall_progress, global_frame):
    sc = SCENES[scene_idx]
    base = Image.new("RGBA", (W, H), (9, 10, 16, 255))
    
    # 1. Background screenshot window
    if sc["img"] != "outro":
        img_key = sc["img"]
        if "img2" in sc and scene_progress >= 0.5:
            img_key = sc["img2"]
            
        scaled_img = CACHED_SCREENS.get(img_key)
        if scaled_img:
            # Subtle pan / zoom using crop offset (ultra-fast!)
            max_pan_x = 1850 - WIN_W # 90 px
            max_pan_y = 1040 - WIN_H # 250 px
            pan_ratio = (scene_progress % 0.5 if "img2" in sc else scene_progress)
            
            crop_x = int(max_pan_x * 0.5) # centered
            crop_y = int(30 + pan_ratio * 50) # gentle subtle downward pan
            
            cropped = scaled_img.crop((crop_x, crop_y, crop_x + WIN_W, crop_y + WIN_H))
            base.paste(cropped, (WIN_X, WIN_Y), MASK_WINDOW)
            
            d_base = ImageDraw.Draw(base)
            d_base.rounded_rectangle([WIN_X, WIN_Y, WIN_X + WIN_W, WIN_Y + WIN_H], radius=20, outline=(56, 189, 248, 120), width=2)
    else:
        # Outro Showcase Card
        d_base = ImageDraw.Draw(base)
        cw, ch = 1400, 750
        cx, cy = (W - cw) // 2, 100
        d_base.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=28, fill=(16, 22, 38, 245), outline=(0, 242, 254, 180), width=3)
        
        # Center logo
        d_base.text((cx + 120, cy + 75), "⚡ AI MEMER", font=ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 64), fill=(0, 242, 254))
        d_base.text((cx + 125, cy + 155), "Turn Today's Live Breaking News Feeds Into Viral Memes & Reels", font=FONT_HEAD, fill=(240, 240, 245))
        
        bullets = [
            "🔥 Real-Time Google News Feeds via PyGNews (8+ Categories)",
            "✨ Groq AI Dark & Deep Punchline Studio (Instant Viral Hooks)",
            "🎬 9:16 Video Reel Maker (Multi-Clip Collab & 20 Viral Layouts)",
            "💎 AI Clarity & Audio Loudness Normalizer (1080p Crystal Clear)",
            "🚀 1-Click Batch Automation & Direct Instagram Publishing"
        ]
        by = cy + 235
        for b in bullets:
            d_base.text((cx + 125, by), b, font=ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 26), fill=(210, 225, 245))
            by += 54
            
        bx, by_btn, bw, bh = cx + 125, cy + 540, 480, 75
        d_base.rounded_rectangle([bx, by_btn, bx + bw, by_btn + bh], radius=18, fill=(0, 242, 254), outline=(255, 255, 255), width=2)
        d_base.text((bx + 40, by_btn + 18), "⚡ START CREATING TODAY", font=ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 28), fill=(10, 15, 25))

    d = ImageDraw.Draw(base)
    
    # 2. Top Header Bar
    bar_y = 15
    d.rounded_rectangle([80, bar_y, W - 80, bar_y + 55], radius=14, fill=(15, 23, 42, 220), outline=(56, 189, 248, 80), width=1)
    d.text((105, bar_y + 12), "⚡ AI MEMER", font=FONT_BRAND, fill=(0, 242, 254))
    d.text((285, bar_y + 16), "PyGNews Live Feed & Studio", font=FONT_SUB, fill=(148, 163, 184))
    
    # Pulsing live demo indicator
    pw, ph = 160, 36
    px, py = W - 80 - pw - 20, bar_y + 10
    pulse = (math.sin(global_frame * 0.15) + 1.0) * 0.5
    red_val = int(190 + 65 * pulse)
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=18, fill=(red_val, 29, 72, 230))
    d.ellipse([px + 14, py + 12, px + 24, py + 22], fill=(255, 255, 255))
    d.text((px + 34, py + 7), "LIVE DEMO", font=FONT_TAG, fill=(255, 255, 255))

    # 3. Lower-Third Glassmorphic Info Card
    card_w, card_h = 1760, 160
    card_x = (W - card_w) // 2
    card_y = H - card_h - 32
    
    d.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=20, fill=(12, 17, 30, 240), outline=(56, 189, 248, 180), width=2)
    
    # Feature tag pill
    tw = int(len(sc["tag"]) * 12.5) + 30
    d.rounded_rectangle([card_x + 30, card_y + 18, card_x + 30 + tw, card_y + 48], radius=10, fill=(0, 242, 254, 45), outline=(0, 242, 254, 200), width=1)
    d.text((card_x + 45, card_y + 22), sc["tag"], font=FONT_TAG, fill=(0, 242, 254))
    
    # English Headline
    d.text((card_x + 30, card_y + 60), sc["head"], font=FONT_HEAD, fill=(255, 255, 255))
    
    # Hindi Subtitle
    d.text((card_x + 30, card_y + 110), sc["hindi"], font=FONT_HINDI, fill=(254, 240, 138))
    
    # 4. Bottom Neon Progress Bar
    prog_w = int(W * overall_progress)
    d.rectangle([0, H - 8, prog_w, H], fill=(0, 242, 254))
    d.rectangle([prog_w, H - 8, W, H], fill=(30, 41, 59))
    
    return base.convert("RGB")

def main():
    print(f"Starting optimized video rendering to {OUTPUT_VIDEO}", flush=True)
    print(f"Total scenes: {len(SCENES)}, Total frames: {TOTAL_FRAMES}", flush=True)

    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "bgr24",
        "-r", str(FPS),
        "-i", "-",
        "-i", MASTER_AUDIO,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_VIDEO
    ]

    pipe = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    global_frame = 0
    for scene_idx, sc in enumerate(SCENES):
        scene_frames = int(sc["duration_sec"] * FPS)
        for f in range(scene_frames):
            scene_progress = f / float(scene_frames)
            overall_progress = global_frame / float(TOTAL_FRAMES)
            
            frame_img = render_scene_frame(scene_idx, scene_progress, overall_progress, global_frame)
            
            # Crossfade transition (last 10 frames of each scene, except last)
            if f >= scene_frames - 10 and scene_idx < len(SCENES) - 1:
                next_frame = render_scene_frame(scene_idx + 1, 0.0, overall_progress, global_frame)
                alpha = (f - (scene_frames - 10)) / 10.0
                frame_img = Image.blend(frame_img, next_frame, alpha)
            
            # Convert RGB to BGR for rawvideo pipe
            r, g, b = frame_img.split()
            bgr_img = Image.merge("RGB", (b, g, r))
            pipe.stdin.write(bgr_img.tobytes())
            
            global_frame += 1
            if global_frame % 300 == 0:
                print(f"Rendered {global_frame}/{TOTAL_FRAMES} frames ({int(overall_progress*100)}%)", flush=True)

    pipe.stdin.close()
    pipe.wait()
    print("FFmpeg rendering finished!", flush=True)
    
    # Copy to root folder
    if os.path.exists(OUTPUT_VIDEO):
        shutil.copy2(OUTPUT_VIDEO, OUTPUT_VIDEO_ROOT)
        print(f"SUCCESS: Video generated!\n1. {OUTPUT_VIDEO}\n2. {OUTPUT_VIDEO_ROOT}", flush=True)
    else:
        print("Error: output video not generated!", flush=True)

if __name__ == "__main__":
    main()
