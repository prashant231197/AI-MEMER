import http.server
import json
import os
import random
import re
import sys
import time
import urllib.parse
import warnings
import hashlib
import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
# Compatibility shim for selectolax >= 1.0 (where modest backend was removed)
try:
    import selectolax
    try:
        from selectolax.parser import HTMLParser
    except (ImportError, AttributeError):
        from selectolax.lexbor import LexborHTMLParser
        import types
        _mod = types.ModuleType("selectolax.parser")
        _mod.HTMLParser = LexborHTMLParser
        sys.modules["selectolax.parser"] = _mod
except Exception:
    pass

try:
    from googlenewsdecoder import gnewsdecoder
except Exception as _dec_err:
    print(f"[DECODER] Note: gnewsdecoder not loaded ({_dec_err}). Using direct URL fallback.")
    def gnewsdecoder(url):
        return {"success": False, "decoded_url": url}

import base64
import io
import subprocess
from pathlib import Path
from PIL import Image
from instagrapi import Client
import yt_dlp
import shutil
try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None


# Ignore BS4 XML warnings
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# Reconfigure stdout/stderr for Windows console compatibility
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Ensure src/ is in sys.path so pygnews can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(CURRENT_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from pygnews import fetcher, constants

PORT = 5050
WEB_DIR = os.path.join(CURRENT_DIR, "web")
VIDEO_DIR = os.path.join(CURRENT_DIR, "media", "videos")
os.makedirs(VIDEO_DIR, exist_ok=True)

# In-memory image and video caches
IMAGE_CACHE = {}
VIDEO_CACHE = {}

try:
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe() if imageio_ffmpeg else (shutil.which("ffmpeg") or "ffmpeg")
except Exception:
    FFMPEG_PATH = shutil.which("ffmpeg") or "ffmpeg"

# Load .env file if available
def load_env_file():
    env_file = os.path.join(CURRENT_DIR, ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception:
            pass

load_env_file()

# Groq AI Cloud Configuration (Loaded securely from .env or environment variable)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()

GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]

# Instagram Session Configuration
IG_SESSION_FILE = os.path.join(CURRENT_DIR, "instagram_session.json")
ig_client = None

def get_instagram_client():
    global ig_client
    if ig_client and getattr(ig_client, "user_id", None):
        return ig_client

    if os.path.exists(IG_SESSION_FILE):
        try:
            cl = Client()
            cl.load_settings(IG_SESSION_FILE)
            if getattr(cl, "user_id", None):
                ig_client = cl
                print(f"[INSTAGRAM] Active session restored for user_id={cl.user_id}")
                return ig_client
        except Exception as e:
            print(f"[INSTAGRAM] Session restore note: {e}")
            ig_client = None
    return None


def is_valid_article_image(img_url):
    """Filter out Google brand logos, icons, avatars, and tracking pixels."""
    if not img_url or not isinstance(img_url, str):
        return False
    lower = img_url.lower().strip()
    if not (lower.startswith("http://") or lower.startswith("https://")):
        return False

    # Strictly reject Google News logo & default brand graphics
    if "google_news" in lower or "gstatic.com" in lower or "googleusercontent.com" in lower:
        return False

    bad_tokens = [
        "logo", "favicon", "avatar", "icon", "sprite", "pixel",
        "tracker", "spinner", "badge", "placeholder", "site-header"
    ]
    for token in bad_tokens:
        if token in lower:
            return False

    return True


def extract_article_image(article_url, title=""):
    """
    Decodes Google News redirect URL to reach the real publisher website
    and scrapes the lead news photograph.
    """
    if not article_url:
        return None

    if article_url in IMAGE_CACHE:
        cached = IMAGE_CACHE[article_url]
        if is_valid_article_image(cached):
            return cached

    real_url = None

    try:
        dec = gnewsdecoder(article_url)
        if dec.get("success") and dec.get("decoded_url"):
            real_url = dec["decoded_url"]
            print(f"[DECODER] Resolved real publisher URL: {real_url}")
    except Exception as e:
        print(f"[DECODER] Error decoding {article_url[:40]}: {e}")

    if not real_url:
        real_url = article_url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }

    try:
        r = requests.get(real_url, headers=headers, timeout=9, allow_redirects=True)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")

            # A. OpenGraph / Twitter Meta Tags
            for prop in ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"]:
                tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
                if tag:
                    candidate = tag.get("content") or tag.get("value")
                    if is_valid_article_image(candidate):
                        img_url = urllib.parse.urljoin(r.url, candidate.strip())
                        print(f"[SCRAPER] Found real photo via {prop}: {img_url}")
                        IMAGE_CACHE[article_url] = img_url
                        return img_url

            # B. JSON-LD Structured Data
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    data = json.loads(script.string or "")
                    candidates = []
                    if isinstance(data, dict):
                        candidates.append(data.get("image"))
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict):
                                candidates.append(item.get("image"))

                    for c in candidates:
                        if isinstance(c, str) and is_valid_article_image(c):
                            img_url = urllib.parse.urljoin(r.url, c.strip())
                            IMAGE_CACHE[article_url] = img_url
                            return img_url
                        elif isinstance(c, dict) and is_valid_article_image(c.get("url")):
                            img_url = urllib.parse.urljoin(r.url, c["url"].strip())
                            IMAGE_CACHE[article_url] = img_url
                            return img_url
                except Exception:
                    pass

            # C. Lead article image elements
            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src") or img.get("data-original")
                if src and is_valid_article_image(src):
                    width = img.get("width")
                    if width and width.isdigit() and int(width) < 200:
                        continue
                    if any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                        img_url = urllib.parse.urljoin(r.url, src.strip())
                        print(f"[SCRAPER] Found real photo in article img tag: {img_url}")
                        IMAGE_CACHE[article_url] = img_url
                        return img_url

    except Exception as e:
        print(f"[SCRAPER] Error fetching {real_url[:50]}: {e}")

    return None


def fetch_or_search_video(source_input, is_search=False):
    """
    Downloads or extracts video from an Instagram Reel, YouTube Shorts,
    direct video URL, or searches the web for a related video clip.
    """
    source_clean = source_input.strip()
    cache_key = f"{'search_' if is_search else 'url_'}{source_clean}"
    if cache_key in VIDEO_CACHE:
        cached_file = VIDEO_CACHE[cache_key]
        if os.path.exists(os.path.join(VIDEO_DIR, cached_file)):
            return cached_file, f"Video: {source_clean[:40]}"

    file_id = hashlib.md5(source_clean.encode()).hexdigest()[:10]
    out_template = os.path.join(VIDEO_DIR, f"reel_{file_id}.%(ext)s")

    if is_search:
        target_query = f"ytsearch1:{source_clean} news video 15 seconds"
    else:
        target_query = source_clean

    ydl_opts = {
        "ffmpeg_location": FFMPEG_PATH,
        "format": "bestvideo*+bestaudio/best",
        "merge_output_format": "mp4",
        "outtmpl": out_template,
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "max_filesize": 40 * 1024 * 1024,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_query, download=True)
            if "entries" in info and info["entries"]:
                info = info["entries"][0]
            
            final_filename = f"reel_{file_id}.mp4"
            actual_path = os.path.join(VIDEO_DIR, final_filename)
            if not os.path.exists(actual_path):
                # Look for matching downloaded file
                for f in os.listdir(VIDEO_DIR):
                    if f.startswith(f"reel_{file_id}"):
                        final_filename = f
                        break

            VIDEO_CACHE[cache_key] = final_filename
            title = info.get("title", "Video Clip")
            return final_filename, title
    except Exception as e:
        print(f"[YT-DLP] Error downloading video for {source_clean[:40]}: {e}")
        # If specific search fails, fallback to sample_reel.mp4 if present
        if os.path.exists(os.path.join(VIDEO_DIR, "sample_reel.mp4")):
            return "sample_reel.mp4", "News Background Motion Clip"
        raise


def call_groq_chat(messages, max_tokens=1500, temperature=0.8):
    """Call Groq API using fast models with automatic model fallback."""
    if not GROQ_API_KEY:
        print("[GROQ] No GROQ_API_KEY configured!")
        return None
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    for model in GROQ_MODELS:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=20)
            if r.status_code == 200:
                data = r.json()
                choice = data.get("choices", [{}])[0]
                content = choice.get("message", {}).get("content", "").strip()
                if content:
                    print(f"[GROQ] Generated response successfully with {model}")
                    return content
                else:
                    print(f"[GROQ] Model {model} returned empty content.")
            else:
                print(f"[GROQ] Model {model} HTTP {r.status_code}: {r.text[:120]}")
        except Exception as e:
            print(f"[GROQ] Model {model} attempt error: {e}")
            continue
    return None


def generate_meme_angles(title, publisher="", category="", vibe="dark"):
    """
    Generate 4 viral dark humor / deep meme angles for image memes using Groq LLM.
    Includes robust fallback if API is unreachable.
    """
    title_clean = re.sub(r'[\r\n\t]+', ' ', title).strip()

    prompt = f"""You are an elite viral dark meme creator, Gen-Z meme philosopher, and savage punchline generator.
Analyze this real breaking news event:
Headline: "{title_clean}"
Publisher: "{publisher}"
Category: "{category}"
Tone request: {vibe} (dark humor, existential irony, deep meme think, relatable absurdity)

Generate 4 hilarious, savage, and deeply ironic meme angles and punchlines for image memes.
Format requirements:
- Vibe badge (e.g. "Dark Irony 💀", "Deep Meme Think 🧠", "Apocalyptic Sarcasm 🖤", "Savage Relatability 😭")
- Template style (e.g. "split_screen", "two_panel", "drake_format", "distracted_boyfriend")
- Top text (concise, setup, max 6-8 words)
- Bottom text (savage punchline, max 8-10 words)
- Punchline (one-line deep dark joke or philosophical observation)

Respond ONLY with valid JSON in this exact structure:
{{
  "headline": "{title_clean}",
  "angles": [
    {{
      "vibe": "Dark Irony 💀",
      "template": "split_screen",
      "style": "split",
      "top_text": "...",
      "bottom_text": "...",
      "punchline": "..."
    }},
    {{
      "vibe": "Deep Meme Think 🧠",
      "template": "two_panel",
      "style": "contrast",
      "top_text": "...",
      "bottom_text": "...",
      "punchline": "..."
    }},
    {{
      "vibe": "Apocalyptic Sarcasm 🖤",
      "template": "breaking_news",
      "style": "headline",
      "top_text": "...",
      "bottom_text": "...",
      "punchline": "..."
    }},
    {{
      "vibe": "Savage Relatability 😭",
      "template": "impact",
      "style": "impact",
      "top_text": "...",
      "bottom_text": "...",
      "punchline": "..."
    }}
  ],
  "caption": "A viral Instagram caption with dark humor & witty punchline",
  "hashtags": "#memes #darkhumor #trending #relatable #dailynews #deepmemes"
}}"""

    raw = call_groq_chat([
        {"role": "system", "content": "You are a master viral meme generator. Respond ONLY with valid JSON."},
        {"role": "user", "content": prompt}
    ], max_tokens=1400, temperature=0.85)

    if raw:
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            parsed = json.loads(clean)
            if "angles" in parsed and len(parsed["angles"]) > 0:
                parsed["source"] = "groq"
                return parsed
        except Exception as e:
            print(f"[GROQ] Error parsing meme angles JSON: {e}")

    # Fallback if Groq unavailable
    return {
        "headline": title_clean,
        "source": "fallback",
        "angles": [
            {
                "vibe": "Dark Irony 💀",
                "template": "split_screen",
                "style": "split",
                "top_text": "POV: Waking up in 2026",
                "bottom_text": "World still broken but bills still due",
                "punchline": "When reality hits harder than the morning alarm."
            },
            {
                "vibe": "Deep Meme Think 🧠",
                "template": "two_panel",
                "style": "contrast",
                "top_text": "Nobody asked for this timeline:",
                "bottom_text": title_clean[:60],
                "punchline": "Bro living in a script written by a chaotic AI."
            },
            {
                "vibe": "Apocalyptic Sarcasm 🖤",
                "template": "breaking_news",
                "style": "headline",
                "top_text": "🔴 BREAKING: EVERYTHING IS FINE",
                "bottom_text": "Just another normal day on planet Earth",
                "punchline": "Smiling through the existential dread."
            },
            {
                "vibe": "Savage Relatability 😭",
                "template": "impact",
                "style": "impact",
                "top_text": "ME TRYING TO FIX MY LIFE",
                "bottom_text": "THE WORLD OUTSIDE:",
                "punchline": "At least we have memes while the world spins."
            }
        ],
        "caption": f"POV: You opened the news today 💀\n\n{title_clean}",
        "hashtags": "#memes #darkhumor #trending #relatable #news"
    }


def generate_reel_hooks(title, publisher="", category="", vibe="dark"):
    """
    Generate 4 viral short-form 9:16 Reel hooks tailored for Instagram Reels using Groq LLM.
    """
    title_clean = re.sub(r'[\r\n\t]+', ' ', title).strip()

    prompt = f"""You are an elite 9:16 Instagram Reels viral hook creator.
News Story: "{title_clean}"
Publisher: "{publisher}"
Vibe: {vibe} (dark humor, curiosity gap, deep meme think, savage punchline)

Generate 4 viral 9:16 Reel hooks optimized for maximum retention on Instagram Reels:
Structure requirements:
1. reel_split: Top Hook for Split-Screen News Card (Bold lead, e.g. "POV: YOU OPENED THE NEWS TODAY 💀") + Caption punchline
2. reel_chyron: TV Breaking News lower-third headline punchline
3. reel_glass_card: Floating POV Reaction quote (Deep meme think / existential shock)
4. reel_impact: Bold impact punchline

Respond ONLY with valid JSON in this exact structure:
{{
  "headline": "{title_clean}",
  "hooks": [
    {{
      "layout": "reel_split",
      "top_hook": "POV: YOU OPENED THE NEWS TODAY 💀",
      "caption": "Savage punchline / deep thought explaining the news",
      "sub_badge": "WAIT TILL THE END 😭",
      "vibe": "Viral Split Screen"
    }},
    {{
      "layout": "reel_chyron",
      "top_hook": "🔴 BREAKING: THE SIMULATION GLITCHED AGAIN",
      "caption": "Deep dark commentary punchline",
      "sub_badge": "HAPPENING RIGHT NOW",
      "vibe": "Live Broadcast Satire"
    }},
    {{
      "layout": "reel_glass_card",
      "top_hook": "Bro negotiated this before my rent got paid 💀",
      "caption": "Existential reaction quote to the headline",
      "sub_badge": "EXPLAIN THIS BRO",
      "vibe": "Deep Meme Think 🧠"
    }},
    {{
      "layout": "reel_impact",
      "top_hook": "REALITY IN 2026 BE LIKE:",
      "caption": "Dark punchline in bold words",
      "sub_badge": "NO WAY THIS IS REAL",
      "vibe": "Shock Value 🔥"
    }}
  ],
  "caption": "Viral reel caption for Instagram description with hashtags",
  "hashtags": "#memes #darkhumor #viralreels #reelsindia #trending #deepthoughts"
}}"""

    raw = call_groq_chat([
        {"role": "system", "content": "You are a master viral Instagram Reel hook engine. Respond ONLY with valid JSON."},
        {"role": "user", "content": prompt}
    ], max_tokens=1400, temperature=0.85)

    if raw:
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            parsed = json.loads(clean)
            if "hooks" in parsed and len(parsed["hooks"]) > 0:
                parsed["source"] = "groq"
                return parsed
        except Exception as e:
            print(f"[GROQ] Error parsing reel hooks JSON: {e}")

    # Fallback hooks
    return {
        "headline": title_clean,
        "publisher": publisher,
        "category": category,
        "source": "fallback",
        "hooks": [
            {
                "layout": "reel_split",
                "top_hook": "POV: YOU OPENED THE NEWS TODAY 💀",
                "caption": title_clean,
                "sub_badge": "WAIT TILL THE END 😭",
                "vibe": "Viral Split Screen"
            },
            {
                "layout": "reel_chyron",
                "top_hook": f"🔴 BREAKING: {publisher.upper() if publisher else 'LIVE REPORT'}",
                "caption": title_clean,
                "sub_badge": "HAPPENING RIGHT NOW",
                "vibe": "Live Broadcast"
            },
            {
                "layout": "reel_glass_card",
                "top_hook": "Nobody asked for this timeline:",
                "caption": f"“{title_clean}”",
                "sub_badge": "EXPLAIN THIS BRO 😭",
                "vibe": "Reaction Card"
            },
            {
                "layout": "reel_impact",
                "top_hook": "REALITY IN 2026 BE LIKE:",
                "caption": title_clean,
                "sub_badge": "NO WAY THIS IS REAL",
                "vibe": "Classic Shock"
            }
        ],
        "caption": f"POV: YOU OPENED THE NEWS TODAY 💀\n\n{title_clean}",
        "hashtags": "#memes #darkhumor #viralreels #reelsindia #trending #news"
    }


def generate_ai_caption(title, publisher="", hook="", vibe="dark"):
    """
    Generate an engaging, viral Instagram post caption with deep dark humor, punchlines, and hashtags.
    """
    clean_title = re.sub(r'[\r\n\t]+', ' ', title).strip()

    prompt = f"""You are a master social media copywriter for a viral dark humor meme page with 1M followers.
News Headline: "{clean_title}"
Publisher: "{publisher}"
Hook: "{hook}"

Write an ultra-engaging Instagram caption for this news meme / reel.
Include:
1. Punchy hook / lead (POV or savage one-liner with emojis)
2. 2-3 lines of deep dark humor / existential meme commentary
3. Call-to-action ("Tag someone who..." or "Drop your thoughts below 💀")
4. 10 viral trending hashtags

Respond ONLY with valid JSON:
{{
  "caption": "Full Instagram caption formatted with clean linebreaks and emojis",
  "hashtags": "#memes #darkhumor #news #trending #viral #deepmemes #reelsindia #relatable"
}}"""

    raw = call_groq_chat([
        {"role": "system", "content": "You write viral dark meme captions. Output strictly valid JSON."},
        {"role": "user", "content": prompt}
    ], max_tokens=800, temperature=0.85)

    if raw:
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            parsed = json.loads(clean)
            if "caption" in parsed and parsed["caption"]:
                return parsed
        except Exception as e:
            print(f"[GROQ] Error parsing AI caption: {e}")

    # Fallback caption
    fallback_caption = f"{hook if hook else 'POV: You opened the news today 💀'}\n\n{clean_title}\n\nWe really living in an unscripted simulation at this point 😭\n\nTag a friend who needs to see this 👇"
    return {
        "caption": fallback_caption,
        "hashtags": "#memes #darkhumor #news #trending #viral #relatable #dailynews"
    }


def check_video_has_audio(vid_path):
    try:
        cmd = [FFMPEG_PATH, "-i", vid_path]
        res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, timeout=10)
        return b"Audio:" in res.stderr
    except Exception:
        return False


def compose_reel_video(vid_name, overlay_data, layout="reel_split", duration=12):
    """
    Composites the background video with the exact transparent layout overlay from browser canvas.
    Burns the edited headline, news card, emojis, tags, and formatting directly into every frame of the video.
    Guarantees Instagram Reels 100% compliant H.264 MP4 with AAC stereo sound.
    """
    src_path = os.path.join(VIDEO_DIR, os.path.basename(vid_name)) if vid_name else ""
    if not src_path or not os.path.exists(src_path) or os.path.getsize(src_path) < 1000:
        src_path = os.path.join(VIDEO_DIR, "sample_reel.mp4")

    timestamp = int(time.time())
    overlay_path = os.path.join(VIDEO_DIR, f"temp_overlay_{timestamp}.png")

    if "," in overlay_data:
        overlay_data = overlay_data.split(",", 1)[1]
    with open(overlay_path, "wb") as f:
        f.write(base64.b64decode(overlay_data))

    out_name = f"composed_reel_{timestamp}.mp4"
    out_path = os.path.join(VIDEO_DIR, out_name)

    has_audio = check_video_has_audio(src_path)

    # 9:16 layout composite filter
    if layout == "reel_split":
        fc = (
            "color=c=black:s=720x1280:r=30[bg];"
            "[0:v]scale=720:768:force_original_aspect_ratio=increase,crop=720:768[vid];"
            "[bg][vid]overlay=0:512:shortest=1[base];"
            "[base][1:v]overlay=0:0[v]"
        )
    else:
        fc = "[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280[vid];[vid][1:v]overlay=0:0[v]"

    cmd = [
        FFMPEG_PATH, "-y",
        "-i", src_path,
        "-i", overlay_path
    ]

    if not has_audio:
        cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])

    cmd.extend([
        "-filter_complex", fc,
        "-map", "[v]",
        "-map", ("2:a" if not has_audio else "0:a?"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        "-t", str(duration),
        "-movflags", "+faststart",
        out_path
    ])

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=40)

    # Clean up temp overlay
    if os.path.exists(overlay_path):
        try:
            os.remove(overlay_path)
        except Exception:
            pass

    if res.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) < 1000:
        err = res.stderr.decode("utf-8", errors="ignore")
        print(f"[COMPOSE] Error running FFmpeg: {err}")
        raise RuntimeError(f"FFmpeg composite failed: {err[:200]}")

    print(f"[COMPOSE] Successfully composed 9:16 Reel: {out_name} (size={os.path.getsize(out_path)} bytes)")
    return out_name, out_path


def serve_video_file(file_path, handler):
    """Serve MP4 video with HTTP 206 Partial Content range requests for smooth looping & seeking."""
    if not os.path.exists(file_path):
        handler.send_response(404)
        handler.end_headers()
        return

    file_size = os.path.getsize(file_path)
    range_header = handler.headers.get("Range")

    if range_header:
        bytes_match = re.search(r"bytes=(\d+)-(\d+)?", range_header)
        start = int(bytes_match.group(1)) if bytes_match else 0
        end = int(bytes_match.group(2)) if bytes_match and bytes_match.group(2) else file_size - 1
        length = end - start + 1

        handler.send_response(206)
        handler.send_header("Content-Type", "video/mp4")
        handler.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        handler.send_header("Content-Length", str(length))
        handler.send_header("Accept-Ranges", "bytes")
        handler.send_header("Access-Control-Allow-Origin", "*")
        handler.end_headers()

        with open(file_path, "rb") as f:
            f.seek(start)
            handler.wfile.write(f.read(length))
    else:
        handler.send_response(200)
        handler.send_header("Content-Type", "video/mp4")
        handler.send_header("Content-Length", str(file_size))
        handler.send_header("Accept-Ranges", "bytes")
        handler.send_header("Access-Control-Allow-Origin", "*")
        handler.end_headers()

        with open(file_path, "rb") as f:
            handler.wfile.write(f.read())



class NewsServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/serve-video":
            return self.do_GET()
        super().do_HEAD()

    def send_json(self, data, status=200):
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/status":
            return self.send_json({"status": "ok", "app": "PyGNews AI Memer & Reel Studio", "version": "2.0.0"})

        if path == "/api/topics":
            return self.send_json({"topics": constants.TOPICS})

        # Instagram connection status
        if path == "/api/instagram/status":
            cl = get_instagram_client()
            if not cl or not getattr(cl, "user_id", None):
                return self.send_json({"connected": False})
            try:
                info = cl.user_info(cl.user_id)
                return self.send_json({
                    "connected": True,
                    "username": info.username,
                    "full_name": info.full_name or info.username,
                    "profile_pic_url": str(info.profile_pic_url or ""),
                    "follower_count": getattr(info, "follower_count", 0),
                    "media_count": getattr(info, "media_count", 0)
                })
            except Exception as e:
                return self.send_json({"connected": False, "error": str(e)})

        # Serve streaming video file
        if path == "/api/serve-video":
            video_name = query.get("name", ["sample_reel.mp4"])[0]
            # Prevent directory traversal
            clean_name = os.path.basename(video_name)
            target_path = os.path.join(VIDEO_DIR, clean_name)
            return serve_video_file(target_path, self)

        # Extract real image from original publisher article
        if path == "/api/extract-image":
            article_url = query.get("url", [""])[0]
            title = query.get("title", [""])[0]
            if not article_url:
                return self.send_json({"error": "url parameter is required"}, status=400)

            img_url = extract_article_image(article_url, title)
            if img_url:
                proxy_url = f"/api/proxy-image?url={urllib.parse.quote_plus(img_url)}"
                return self.send_json({
                    "success": True,
                    "imageUrl": img_url,
                    "proxyUrl": proxy_url
                })
            else:
                return self.send_json({
                    "success": False,
                    "message": "No lead photograph found on publisher page."
                })

        # Proxy image to prevent CORS canvas taint issues
        if path == "/api/proxy-image":
            target_img_url = query.get("url", [""])[0]
            if not target_img_url:
                self.send_response(400)
                self.end_headers()
                return

            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    "Referer": "https://news.google.com/"
                }
                r = requests.get(target_img_url, headers=headers, timeout=10, stream=True)
                if r.status_code == 200:
                    content_type = r.headers.get("Content-Type", "image/jpeg")
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Cache-Control", "public, max-age=86400")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(r.content)
                    return
            except Exception as e:
                print(f"Proxy error for {target_img_url[:40]}: {e}")

            self.send_response(404)
            self.end_headers()
            return

        # Fetch News feeds
        if path == "/api/news":
            feed_type = query.get("type", ["top"])[0].lower()
            country = query.get("country", ["US"])[0].upper()
            language = query.get("lang", ["en"])[0].lower()

            try:
                gnews = fetcher.PyGNews(country=country, language=language)

                if feed_type == "topic":
                    topic = query.get("topic", ["TECHNOLOGY"])[0].upper()
                    raw = gnews.topic_headlines(topic=topic)
                elif feed_type == "location":
                    location = query.get("location", [country])[0].upper()
                    raw = gnews.location_headlines(location=location)
                elif feed_type == "search":
                    search_query = query.get("q", [""])[0]
                    since_when = query.get("since", [None])[0]
                    if not search_query.strip():
                        return self.send_json({"error": "Search query cannot be empty"}, status=400)
                    raw = gnews.search(search_query=search_query, since_when=since_when)
                else:
                    raw = gnews.top_stories()

                articles = []
                clusters = []
                for idx, cluster_items in raw.items():
                    if not cluster_items:
                        continue
                    valid_items = [
                        item for item in cluster_items 
                        if item.get("title") and item.get("url")
                    ]
                    if not valid_items:
                        continue
                    main_item = valid_items[0]
                    clusters.append({
                        "cluster_id": idx,
                        "main_story": main_item,
                        "related_coverage": valid_items[1:],
                        "total_sources": len(valid_items)
                    })
                    for item in valid_items:
                        articles.append({
                            **item,
                            "cluster_id": idx,
                            "is_lead": (item == main_item)
                        })

                return self.send_json({
                    "type": feed_type,
                    "country": country,
                    "language": language,
                    "total_clusters": len(clusters),
                    "total_articles": len(articles),
                    "clusters": clusters,
                    "articles": articles
                })
            except Exception as e:
                return self.send_json({"error": str(e)}, status=500)

        return super().do_GET()

    def do_POST(self):
        global ig_client
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Generate dark/deep meme angles with Groq AI
        if path == "/api/meme-suggest":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            title = payload.get("title", "")
            publisher = payload.get("publisher", "")
            category = payload.get("category", "")
            vibe = payload.get("vibe", "dark")

            if not title:
                return self.send_json({"error": "Title is required for meme generation"}, status=400)

            meme_data = generate_meme_angles(title, publisher, category, vibe)
            return self.send_json(meme_data)

        # Generate Reel specific viral hooks with Groq AI
        if path == "/api/reel-hooks":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            title = payload.get("title", "")
            publisher = payload.get("publisher", "")
            category = payload.get("category", "")
            vibe = payload.get("vibe", "dark")
            return self.send_json(generate_reel_hooks(title, publisher, category, vibe))

        # Generate viral Instagram caption with Groq AI
        if path == "/api/ai-caption":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            title = payload.get("title", "")
            publisher = payload.get("publisher", "")
            hook = payload.get("hook", "")
            vibe = payload.get("vibe", "dark")
            return self.send_json(generate_ai_caption(title, publisher, hook, vibe))

        # Fetch / Search Video Reel from Instagram, YouTube, or web
        if path == "/api/fetch-reel-video":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            source_url = payload.get("url", "").strip()
            query = payload.get("query", "").strip()
            mode = payload.get("type", "url")  # "url", "search", or "preset"

            if mode == "preset":
                preset_name = payload.get("preset", "sample_reel.mp4")
                return self.send_json({
                    "success": True,
                    "videoUrl": f"/api/serve-video?name={preset_name}",
                    "title": "Preset Video Loop"
                })

            target = query if mode == "search" else source_url
            if not target:
                return self.send_json({"error": "URL or search query is required"}, status=400)

            try:
                filename, title = fetch_or_search_video(target, is_search=(mode == "search"))
                return self.send_json({
                    "success": True,
                    "videoUrl": f"/api/serve-video?name={filename}",
                    "title": title
                })
            except Exception as e:
                return self.send_json({"error": f"Failed to fetch video: {str(e)}"}, status=500)

        # Upload local or canvas-rendered video file
        if path == "/api/upload-video":
            content_length = int(self.headers.get("Content-Length", 0))
            video_data = self.rfile.read(content_length)
            if not video_data:
                return self.send_json({"error": "No video data received"}, status=400)

            file_id = hashlib.md5(video_data[:500]).hexdigest()[:10]
            # Detect webm (starts with EBML header \x1aE\xdf\xa3) vs mp4
            ext = "webm" if video_data.startswith(b"\x1aE\xdf\xa3") else "mp4"
            filename = f"upload_{file_id}_{int(time.time())}.{ext}"
            target_path = os.path.join(VIDEO_DIR, filename)

            with open(target_path, "wb") as f:
                f.write(video_data)

            return self.send_json({
                "success": True,
                "filename": filename,
                "videoUrl": f"/api/serve-video?name={filename}",
                "title": "Uploaded Video"
            })

        # Render & Composite 9:16 Reel Video with custom layout & headline overlay
        if path == "/api/render-reel-video":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            video_name = payload.get("video_name", "")
            overlay = payload.get("overlay", "")
            layout = payload.get("layout", "reel_split")
            duration = int(payload.get("duration", 12))

            if not overlay:
                return self.send_json({"error": "Overlay graphic is required to render reel"}, status=400)

            try:
                out_name, out_path = compose_reel_video(video_name, overlay, layout=layout, duration=duration)
                return self.send_json({
                    "success": True,
                    "filename": out_name,
                    "videoUrl": f"/api/serve-video?name={out_name}",
                    "title": "Rendered 9:16 Reel"
                })
            except Exception as e:
                print(f"[REEL RENDER] Error: {e}")
                return self.send_json({"error": f"Failed to render reel: {str(e)}"}, status=500)

        # Instagram Connect (Session ID or Username/Password)
        if path == "/api/instagram/connect":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            method = payload.get("method", "sessionid")
            try:
                cl = Client()
                if method == "sessionid":
                    sessionid = payload.get("sessionid", "").strip()
                    if not sessionid:
                        return self.send_json({"error": "Instagram sessionid cookie is required"}, status=400)
                    cl.login_by_sessionid(sessionid)
                else:
                    username = payload.get("username", "").strip()
                    password = payload.get("password", "").strip()
                    code = payload.get("verification_code", "").strip() or None
                    if not username or not password:
                        return self.send_json({"error": "Instagram username and password are required"}, status=400)
                    cl.login(username, password, verification_code=code)

                info = cl.user_info(cl.user_id)
                cl.dump_settings(IG_SESSION_FILE)
                ig_client = cl

                return self.send_json({
                    "success": True,
                    "username": info.username,
                    "full_name": info.full_name or info.username,
                    "profile_pic_url": str(info.profile_pic_url or ""),
                    "follower_count": getattr(info, "follower_count", 0),
                    "media_count": getattr(info, "media_count", 0)
                })
            except Exception as e:
                print(f"[INSTAGRAM] Connect error: {e}")
                return self.send_json({"error": str(e)}, status=400)

        # Instagram Disconnect / Logout
        if path == "/api/instagram/logout":
            ig_client = None
            if os.path.exists(IG_SESSION_FILE):
                try:
                    os.remove(IG_SESSION_FILE)
                except Exception:
                    pass
            return self.send_json({"success": True})

        # Instagram Publish Photo
        if path == "/api/instagram/publish-photo":
            cl = get_instagram_client()
            if not cl:
                return self.send_json({"error": "Instagram is not connected. Please connect your account first."}, status=401)

            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            img_data = payload.get("image", "")
            caption = payload.get("caption", "").strip()
            hashtags = payload.get("hashtags", "").strip()

            if not img_data:
                return self.send_json({"error": "Image data is required"}, status=400)

            try:
                if "," in img_data:
                    img_data = img_data.split(",", 1)[1]
                raw_bytes = base64.b64decode(img_data)
                img = Image.open(io.BytesIO(raw_bytes))

                if img.mode != "RGB":
                    img = img.convert("RGB")

                temp_path = os.path.join(CURRENT_DIR, "media", f"ig_photo_{int(time.time())}.jpg")
                img.save(temp_path, "JPEG", quality=95)

                full_caption = caption
                if hashtags:
                    full_caption = f"{caption}\n\n{hashtags}".strip() if caption else hashtags

                media = cl.photo_upload(temp_path, caption=full_caption)
                
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

                return self.send_json({
                    "success": True,
                    "post_url": f"https://www.instagram.com/p/{media.code}/",
                    "code": media.code,
                    "id": str(media.id)
                })
            except Exception as e:
                print(f"[INSTAGRAM] Photo upload error: {e}")
                return self.send_json({"error": f"Failed to publish photo: {str(e)}"}, status=500)

        # Instagram Publish 9:16 Video Reel
        if path == "/api/instagram/publish-reel":
            cl = get_instagram_client()
            if not cl:
                return self.send_json({"error": "Instagram is not connected. Please connect your account first."}, status=401)

            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            video_name = payload.get("video_name", "")
            overlay = payload.get("overlay", "")
            layout = payload.get("layout", "reel_split")
            caption = payload.get("caption", "").strip()
            hashtags = payload.get("hashtags", "").strip()
            cover_data = payload.get("thumbnail", "")

            try:
                target_path = None
                
                # Check if video_name is already a composed or uploaded file
                if video_name:
                    clean_name = os.path.basename(video_name)
                    candidate = os.path.join(VIDEO_DIR, clean_name)
                    if (clean_name.startswith("composed_reel_") or clean_name.startswith("upload_")) and os.path.exists(candidate) and os.path.getsize(candidate) > 1000:
                        target_path = candidate
                        print(f"[INSTAGRAM] Using existing edited reel: {target_path}")

                # If not composed yet, but custom overlay is provided -> Compose video with overlay now!
                if not target_path and overlay:
                    try:
                        print(f"[INSTAGRAM] Composing source video '{video_name}' with custom overlay for layout '{layout}'...")
                        composed_name, composed_path = compose_reel_video(video_name, overlay, layout=layout, duration=12)
                        target_path = composed_path
                        print(f"[INSTAGRAM] Composed reel ready: {target_path}")
                    except Exception as ce:
                        print(f"[INSTAGRAM] Auto-compose error: {ce}")
                        raise RuntimeError(f"Could not render reel with custom format: {ce}")

                # STRICT CRITICAL SAFEGUARD: Never upload raw unedited video to Instagram!
                if not target_path or os.path.basename(target_path).startswith("reel_") or os.path.basename(target_path) == "sample_reel.mp4":
                    return self.send_json({"error": "Reel must be rendered with your meme text and layout before publishing to Instagram. Please try again."}, status=400)

                print(f"[INSTAGRAM] Source video for reel: {target_path} (size={os.path.getsize(target_path)} bytes)")

                # Ensure 100% compliant Instagram H.264 MP4 with faststart
                final_mp4_path = os.path.join(VIDEO_DIR, f"ig_ready_{int(time.time())}.mp4")
                conv_cmd = [
                    FFMPEG_PATH, "-y",
                    "-i", target_path,
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-preset", "veryfast",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-movflags", "+faststart",
                    final_mp4_path
                ]
                res = subprocess.run(conv_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
                if os.path.exists(final_mp4_path) and os.path.getsize(final_mp4_path) > 1000:
                    target_path = final_mp4_path
                    print(f"[INSTAGRAM] Transcoded to IG MP4: {final_mp4_path} ({os.path.getsize(final_mp4_path)} bytes)")

                full_caption = caption
                if hashtags:
                    full_caption = f"{caption}\n\n{hashtags}".strip() if caption else hashtags

                # High-resolution cover thumbnail from canvas snapshot
                thumb_path = os.path.splitext(target_path)[0] + "_thumb.jpg"
                if cover_data:
                    try:
                        if "," in cover_data:
                            cover_data = cover_data.split(",", 1)[1]
                        raw_c = base64.b64decode(cover_data)
                        c_img = Image.open(io.BytesIO(raw_c))
                        if c_img.mode != "RGB":
                            c_img = c_img.convert("RGB")
                        c_img.save(thumb_path, "JPEG", quality=95)
                    except Exception as ce:
                        print(f"[INSTAGRAM] Cover save note: {ce}")

                if not os.path.exists(thumb_path) or os.path.getsize(thumb_path) == 0:
                    try:
                        subprocess.run([
                            FFMPEG_PATH, "-y",
                            "-ss", "00:00:00.500",
                            "-i", target_path,
                            "-vframes", "1",
                            "-q:v", "2",
                            thumb_path
                        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
                    except Exception as e:
                        print(f"[INSTAGRAM] Thumbnail extraction note: {e}")

                thumb_arg = Path(thumb_path) if os.path.exists(thumb_path) and os.path.getsize(thumb_path) > 0 else None
                print(f"[INSTAGRAM] Publishing reel to Instagram: {target_path} (thumbnail={thumb_arg})")

                if thumb_arg:
                    media = cl.clip_upload(Path(target_path), caption=full_caption, thumbnail=thumb_arg)
                else:
                    media = cl.clip_upload(Path(target_path), caption=full_caption)

                return self.send_json({
                    "success": True,
                    "reel_url": f"https://www.instagram.com/reel/{media.code}/",
                    "post_url": f"https://www.instagram.com/reel/{media.code}/",
                    "code": media.code,
                    "id": str(media.id)
                })
            except Exception as e:
                print(f"[INSTAGRAM] Reel upload error: {e}")
                return self.send_json({"error": f"Failed to publish reel: {str(e)}"}, status=500)

        self.send_response(404)
        self.end_headers()


def run_server(port=PORT):
    server_address = ("", port)
    try:
        httpd = http.server.HTTPServer(server_address, NewsServerHandler)
        print(f"AI Memer & Reel Server running at http://localhost:{port}")
        print(f"Serving Web App from: {WEB_DIR}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()
    except OSError as err:
        if err.errno == 10048 or "Address already in use" in str(err):
            alt_port = port + 1
            print(f"Port {port} in use, trying {alt_port}...")
            run_server(alt_port)
        else:
            raise


if __name__ == "__main__":
    run_server()
