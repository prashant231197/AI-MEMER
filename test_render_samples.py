import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1920, 1080
SCREENS_DIR = os.path.join(os.path.dirname(__file__), "ad_assets", "screens")
OUT_DIR = os.path.join(os.path.dirname(__file__), "ad_assets", "samples")
os.makedirs(OUT_DIR, exist_ok=True)

# Load fonts
try:
    FONT_BRAND = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
    FONT_TAG = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 20)
    FONT_HEAD = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 34)
    FONT_HINDI = ImageFont.truetype(r"C:\Windows\Fonts\Nirmala.ttc", 27)
    FONT_SUB = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 20)
except Exception:
    FONT_BRAND = FONT_TAG = FONT_HEAD = FONT_HINDI = FONT_SUB = ImageFont.load_default()

scenes_info = [
    {
        "id": 1,
        "img": "01_dashboard.png",
        "tag": "⚡ WELCOME TO AI MEMER",
        "head": "Tired of spending hours making Memes & Reels? Meet AI MEMER!",
        "hindi": "क्या आप भी सोशल मीडिया पर वायरल मीम्स और रील्स बनाने में घंटों लगाते हैं? पेश है — AI MEMER!",
    },
    {
        "id": 2,
        "img": "02_tech_feed.png",
        "tag": "📰 REAL-TIME NEWS FEEDS",
        "head": "Live Google News Feeds • Tech, Business, Entertainment & Sports",
        "hindi": "AI MEMER दुनिया भर की ब्रेकिंग न्यूज़ को रियल-टाइम में फ़ेच करता है — बस एक क्लिक में!",
    },
    {
        "id": 3,
        "img": "03_meme_studio.png",
        "tag": "✨ GROQ AI PUNCHLINE STUDIO",
        "head": "7+ Meme Templates • Instant Dark Irony & Savage Viral Punchlines",
        "hindi": "किसी भी हेडलाइन को सेलेक्ट करें, और Groq AI तुरंत तैयार करेगा डार्क ह्यूमर और सेवेज पंचलाइन्स!",
    },
    {
        "id": 4,
        "img": "04_reel_studio.png",
        "tag": "🎬 9:16 VIRAL REEL MAKER",
        "head": "Multi-Clip Collab Editor • Dual Split-Screen & PiP Reaction Drop",
        "hindi": "मल्टी-क्लिप कोलैब एडिटिंग, डुअल स्प्लिट-स्क्रीन और वायरल वीडियो मोन्टाज!",
    },
    {
        "id": 5,
        "img": "05b_chyron_layout.png",
        "tag": "💎 20 VIRAL PATTERNS + AI CLARITY",
        "head": "Breaking TV Chyron, Satire Cards + AI 1080p Video & Audio Enhancer",
        "hindi": "20 से ज़्यादा वायरल वीडियो पैटर्न्स और AI क्लैरिटी एन्हांसर — 1080p क्रिस्टल-क्लियर क्वालिटी!",
    },
    {
        "id": 6,
        "img": "06_batch_selected.png",
        "tag": "🚀 1-CLICK BATCH AUTOMATION",
        "head": "Select All News ➔ Generate Reels ➔ Auto-Publish to Instagram",
        "hindi": "सिलेक्ट ऑल न्यूज़ पर क्लिक करें, और एक साथ टॉप खबरों की रील्स बनाकर सीधे इंस्टाग्राम पर पोस्ट करें!",
    },
    {
        "id": 7,
        "img": "outro",
        "tag": "⚡ CREATE VIRAL CONTENT TODAY",
        "head": "100x Faster Content Creation • Fully Automated Live News to Reels",
        "hindi": "तो देर किस बात की? आज ही अपनाइए AI MEMER, और अपने कंटेंट क्रिएशन को बनाइए 100x तेज़!",
    }
]

def render_frame(scene_idx, progress=0.3):
    sc = scenes_info[scene_idx]
    base = Image.new("RGBA", (W, H), (9, 10, 16, 255))
    
    # 1. Background image / window
    if sc["img"] != "outro":
        img_path = os.path.join(SCREENS_DIR, sc["img"])
        if os.path.exists(img_path):
            screenshot = Image.open(img_path).convert("RGBA")
            # Smooth scale with Ken Burns zoom
            scale = 1.0 + progress * 0.05
            target_w = int(1760 * scale)
            target_h = int(990 * scale)
            screenshot_resized = screenshot.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # Crop to window: width 1760, height 790
            win_w, win_h = 1760, 790
            start_x = (target_w - win_w) // 2
            start_y = int((target_h - win_h) * 0.25) # slightly higher focus
            cropped = screenshot_resized.crop((start_x, start_y, start_x + win_w, start_y + win_h))
            
            # Create rounded mask
            mask = Image.new("L", (win_w, win_h), 0)
            d_mask = ImageDraw.Draw(mask)
            d_mask.rounded_rectangle([0, 0, win_w, win_h], radius=20, fill=255)
            
            # Paste screenshot window
            win_x, win_y = (W - win_w) // 2, 85
            base.paste(cropped, (win_x, win_y), mask)
            
            # Draw window border
            d_base = ImageDraw.Draw(base)
            d_base.rounded_rectangle([win_x, win_y, win_x + win_w, win_y + win_h], radius=20, outline=(56, 189, 248, 120), width=2)
    else:
        # Outro custom graphic
        d_base = ImageDraw.Draw(base)
        # Big central glowing card
        cw, ch = 1400, 750
        cx, cy = (W - cw) // 2, 100
        d_base.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=28, fill=(16, 22, 38, 240), outline=(0, 242, 254, 180), width=3)
        
        # Center logo
        d_base.text((cx + 120, cy + 80), "⚡ AI MEMER", font=ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 64), fill=(0, 242, 254))
        d_base.text((cx + 125, cy + 160), "Turn Today's Live Breaking News Feeds Into Viral Memes & Reels", font=FONT_HEAD, fill=(240, 240, 245))
        
        # Feature bullets
        bullets = [
            "🔥 Real-Time Google News Feeds via PyGNews (8+ Categories)",
            "✨ Groq AI Dark & Deep Punchline Studio (Instant Viral Hooks)",
            "🎬 9:16 Video Reel Maker (Multi-Clip Collab & 20 Viral Layouts)",
            "💎 AI Clarity & Audio Loudness Normalizer (1080p Crystal Clear)",
            "🚀 1-Click Batch Automation & Direct Instagram Publishing"
        ]
        by = cy + 240
        for b in bullets:
            d_base.text((cx + 125, by), b, font=ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 26), fill=(210, 225, 245))
            by += 55
            
        # CTA button
        bx, by_btn, bw, bh = cx + 125, cy + 540, 480, 75
        d_base.rounded_rectangle([bx, by_btn, bx + bw, by_btn + bh], radius=18, fill=(0, 242, 254), outline=(255, 255, 255), width=2)
        d_base.text((bx + 40, by_btn + 18), "⚡ START CREATING TODAY", font=ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 28), fill=(10, 15, 25))

    d = ImageDraw.Draw(base)
    
    # 2. Top Header Bar
    bar_y = 15
    d.rounded_rectangle([80, bar_y, W - 80, bar_y + 55], radius=14, fill=(15, 23, 42, 220), outline=(56, 189, 248, 80), width=1)
    d.text((105, bar_y + 12), "⚡ AI MEMER", font=FONT_BRAND, fill=(0, 242, 254))
    d.text((285, bar_y + 16), "PyGNews Live Feed & Studio", font=FONT_SUB, fill=(148, 163, 184))
    
    # Live Demo pill
    pw, ph = 160, 36
    px, py = W - 80 - pw - 20, bar_y + 10
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=18, fill=(225, 29, 72, 220))
    d.ellipse([px + 14, py + 12, px + 24, py + 22], fill=(255, 255, 255))
    d.text((px + 34, py + 7), "LIVE DEMO", font=FONT_TAG, fill=(255, 255, 255))

    # 3. Lower-Third Glassmorphic Feature Info Card
    card_w, card_h = 1760, 160
    card_x = (W - card_w) // 2
    card_y = H - card_h - 32
    
    # Background glass box
    d.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=20, fill=(12, 17, 30, 235), outline=(56, 189, 248, 180), width=2)
    
    # Feature tag pill
    tw = int(len(sc["tag"]) * 12.5) + 30
    d.rounded_rectangle([card_x + 30, card_y + 18, card_x + 30 + tw, card_y + 48], radius=10, fill=(0, 242, 254, 45), outline=(0, 242, 254, 200), width=1)
    d.text((card_x + 45, card_y + 22), sc["tag"], font=FONT_TAG, fill=(0, 242, 254))
    
    # English Headline
    d.text((card_x + 30, card_y + 60), sc["head"], font=FONT_HEAD, fill=(255, 255, 255))
    
    # Hindi Subtitle
    d.text((card_x + 30, card_y + 110), sc["hindi"], font=FONT_HINDI, fill=(254, 240, 138)) # soft warm yellow for clear subtitle readability
    
    # 4. Bottom Neon Progress Bar
    prog_w = int(W * progress)
    d.rectangle([0, H - 8, prog_w, H], fill=(0, 242, 254))
    d.rectangle([prog_w, H - 8, W, H], fill=(30, 41, 59))
    
    return base.convert("RGB")

for i in range(len(scenes_info)):
    img = render_frame(i, progress=(i + 1) / len(scenes_info))
    img.save(os.path.join(OUT_DIR, f"scene_{i+1}_sample.jpg"), quality=92)
    print(f"Rendered sample scene_{i+1}")

