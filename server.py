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


def get_video_info(file_path):
    """Probe video dimensions, duration, and quality with ffmpeg."""
    info = {"width": 1080, "height": 1920, "quality": "1080p Full HD", "badge": "💎 1080p Full HD", "duration": 12.0}
    if not file_path or not os.path.exists(file_path):
        return info
    try:
        cmd = [FFMPEG_PATH, "-i", file_path]
        res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, timeout=8)
        stderr_text = res.stderr.decode("utf-8", errors="ignore")
        match = re.search(r"Video:.*?, (\d{3,4})x(\d{3,4})", stderr_text)
        if match:
            w, h = int(match.group(1)), int(match.group(2))
            info["width"] = w
            info["height"] = h
            min_dim = min(w, h)
            max_dim = max(w, h)
            if max_dim >= 1920 or min_dim >= 1080:
                info["quality"] = "1080p Full HD"
                info["badge"] = f"💎 {w}x{h} Full HD"
            elif max_dim >= 1280 or min_dim >= 720:
                info["quality"] = "720p HD"
                info["badge"] = f"⚡ {w}x{h} Crisp HD"
            else:
                info["quality"] = f"{min_dim}p"
                info["badge"] = f"🎬 {w}x{h}"
        dur_match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)", stderr_text)
        if dur_match:
            hrs, mins, secs = int(dur_match.group(1)), int(dur_match.group(2)), float(dur_match.group(3))
            info["duration"] = round(hrs * 3600 + mins * 60 + secs, 1)
    except Exception as e:
        print(f"[PROBE] Note: {e}")
    return info


def ensure_h264_mp4(src_path):
    """
    Ensure the downloaded file is standard H.264 MP4 with faststart flags.
    Converts webm/mkv or non-H264 video so HTML5 video element in Chrome/Edge streams smoothly.
    """
    if not src_path or not os.path.exists(src_path):
        return src_path
    
    base, ext = os.path.splitext(src_path)
    try:
        cmd = [FFMPEG_PATH, "-i", src_path]
        res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, timeout=8)
        stderr_text = res.stderr.decode("utf-8", errors="ignore")
        is_h264 = "Video: h264" in stderr_text
        has_audio = "Audio:" in stderr_text

        # If it's already mp4 and h264, it's ready
        if ext.lower() == ".mp4" and is_h264:
            return src_path

        out_mp4 = base + "_hd.mp4"
        convert_cmd = [
            FFMPEG_PATH, "-y",
            "-i", src_path,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "veryfast",
            "-crf", "18",
            "-movflags", "+faststart"
        ]
        if has_audio:
            convert_cmd.extend(["-c:a", "aac", "-b:a", "192k"])
        else:
            convert_cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-c:a", "aac", "-b:a", "128k"])
        
        convert_cmd.append(out_mp4)
        sub_res = subprocess.run(convert_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if sub_res.returncode == 0 and os.path.exists(out_mp4) and os.path.getsize(out_mp4) > 1000:
            return out_mp4
    except Exception as e:
        print(f"[ENSURE_H264] Conversion note: {e}")
    return src_path


def extract_news_search_queries(headline, related_coverage=None):
    """
    Extract substantive keywords to form multiple prioritized search queries
    specifically for finding relevant news b-roll and broadcast footage.
    """
    clean_h = re.sub(r"[^\w\s]", " ", headline)
    stop_words = {
        "the", "and", "for", "with", "from", "that", "this", "after", "into", "over",
        "says", "said", "will", "what", "when", "where", "how", "today", "news", "amid",
        "first", "about", "could", "have", "been", "their", "more", "also", "some", "cost",
        "costs", "just", "like", "they", "than", "were", "here", "there", "breaking"
    }
    words = [w for w in clean_h.split() if len(w) > 2 and w.lower() not in stop_words]
    core_kw = " ".join(words[:4]) if words else headline[:30]

    related_kws = []
    if related_coverage and isinstance(related_coverage, list):
        for item in related_coverage[:3]:
            r_title = item.get("title", "") if isinstance(item, dict) else str(item)
            r_clean = re.sub(r"[^\w\s]", " ", r_title)
            r_words = [w for w in r_clean.split() if len(w) > 2 and w.lower() not in stop_words]
            if r_words:
                related_kws.append(" ".join(r_words[:4]))

    queries = [
        f"{core_kw} footage",
        f"{core_kw} news report",
    ]
    if related_kws:
        queries.insert(1, f"{related_kws[0]} footage")
        if len(related_kws) > 1:
            queries.append(f"{related_kws[1]} news")
    queries.append(f"{core_kw} b roll")
    queries.append(f"{core_kw} broadcast")
    return queries


def fetch_or_search_video(source_input, is_search=False, related_queries=None):
    """
    Downloads highest-quality HD video from Instagram Reel, YouTube Shorts,
    TikTok, Pinterest, direct MP4 link, or searches the web for relatable news video clips.
    Uses multi-query retry loop and filters out irrelevant entertainment/gaming/roller coaster footage.
    """
    source_clean = source_input.strip()
    cache_key = f"{'search_' if is_search else 'url_'}{source_clean}"
    if cache_key in VIDEO_CACHE:
        cached_info = VIDEO_CACHE[cache_key]
        cached_file = cached_info.get("filename") if isinstance(cached_info, dict) else cached_info
        if os.path.exists(os.path.join(VIDEO_DIR, cached_file)):
            full_path = os.path.join(VIDEO_DIR, cached_file)
            vid_info = get_video_info(full_path)
            cached_title = cached_info.get("title", f"Video: {source_clean[:40]}") if isinstance(cached_info, dict) else f"Video: {source_clean[:40]}"
            return cached_file, cached_title, vid_info

    file_id = hashlib.md5(source_clean.encode()).hexdigest()[:10]

    # Direct URL mode (Instagram, YouTube, direct MP4, etc.)
    if not is_search:
        target_query = source_clean
        out_template = os.path.join(VIDEO_DIR, f"reel_{file_id}.%(ext)s")

        # Direct Instagram Reel via instagrapi
        if ("instagram.com/reel/" in target_query or "instagram.com/p/" in target_query):
            cl = get_instagram_client()
            if cl:
                try:
                    print(f"[INSTAGRAM] Attempting high-quality reel download via session client...")
                    media_pk = cl.media_pk_from_url(target_query)
                    ig_path = cl.clip_download(media_pk, folder=VIDEO_DIR)
                    if ig_path and os.path.exists(ig_path):
                        final_fname = os.path.basename(ig_path)
                        final_fname = os.path.basename(ensure_h264_mp4(os.path.join(VIDEO_DIR, final_fname)))
                        v_info = get_video_info(os.path.join(VIDEO_DIR, final_fname))
                        VIDEO_CACHE[cache_key] = {"filename": final_fname, "title": "Instagram Reel (HD)"}
                        return final_fname, "Instagram Reel (HD)", v_info
                except Exception as ig_err:
                    print(f"[INSTAGRAM] instagrapi fallback note: {ig_err}")

        ydl_opts = {
            "ffmpeg_location": FFMPEG_PATH,
            "format": "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best[height<=720]/best",
            "merge_output_format": "mp4",
            "outtmpl": out_template,
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "socket_timeout": 15,
            "concurrent_fragment_downloads": 4,
            "max_filesize": 50 * 1024 * 1024,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_query, download=True)
            if "entries" in info and info["entries"]:
                info = info["entries"][0]
            
            final_filename = f"reel_{file_id}.mp4"
            actual_path = os.path.join(VIDEO_DIR, final_filename)
            if not os.path.exists(actual_path):
                candidates = [f for f in os.listdir(VIDEO_DIR) if f.startswith(f"reel_{file_id}") and not f.endswith(".part")]
                if candidates:
                    candidates.sort(key=lambda x: (x.endswith(".mp4"), os.path.getsize(os.path.join(VIDEO_DIR, x))), reverse=True)
                    actual_path = os.path.join(VIDEO_DIR, candidates[0])

            ensured_path = ensure_h264_mp4(actual_path)
            final_filename = os.path.basename(ensured_path)
            v_info = get_video_info(ensured_path)
            title = info.get("title", "HD Video Clip")
            VIDEO_CACHE[cache_key] = {"filename": final_filename, "title": title}
            return final_filename, title, v_info

    # Search Mode with Multi-Query & Candidate Retry Loop
    queries_to_try = []
    if related_queries and isinstance(related_queries, list):
        for rq in related_queries:
            if isinstance(rq, str) and rq.strip() and rq.strip() not in queries_to_try:
                queries_to_try.append(rq.strip())

    generated_queries = extract_news_search_queries(source_clean)
    for gq in generated_queries:
        if gq not in queries_to_try:
            queries_to_try.append(gq)

    print(f"[VIDEO_SEARCH] Searching relatable footage for: '{source_clean[:60]}'")
    print(f"[VIDEO_SEARCH] Queries to attempt: {queries_to_try}")

    bad_terms = [
        "gameplay", "roller coaster", "six flags", "minecraft", "roblox",
        "gta", "prank", "music video", "dance challenge", "parody",
        "funny meme", "compilation", "tiktok dance", "makeup tutorial"
    ]

    for q_idx, q in enumerate(queries_to_try):
        print(f"[VIDEO_SEARCH] Attempt {q_idx + 1}/{len(queries_to_try)}: '{q}'")
        clean_q = re.sub(r"[^\w\s-]", " ", q).strip()
        search_target = f"ytsearch6:{clean_q}"

        ydl_search_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
            "socket_timeout": 12,
        }

        entries = []
        try:
            with yt_dlp.YoutubeDL(ydl_search_opts) as ydl_s:
                search_res = ydl_s.extract_info(search_target, download=False)
                if search_res and "entries" in search_res:
                    entries = [e for e in search_res["entries"] if e]
        except Exception as se:
            print(f"[VIDEO_SEARCH] Search flat extract note for '{q}': {se}")
            continue

        if not entries:
            continue

        valid_candidates = []
        for e in entries:
            d = e.get("duration") or 0
            t = (e.get("title") or "").lower()
            is_live = bool(e.get("is_live"))
            if not is_live and (5 <= d <= 600 or d == 0) and not any(bt in t for bt in bad_terms):
                valid_candidates.append(e)

        if not valid_candidates:
            print(f"[VIDEO_SEARCH] No suitable clean candidates in query '{q}'. Trying next query...")
            continue

        for cand in valid_candidates:
            cand_url = cand.get("url") or cand.get("webpage_url") or f"https://www.youtube.com/watch?v={cand.get('id')}"
            cand_title = cand.get("title") or "News Footage"
            cand_id = hashlib.md5(cand_url.encode()).hexdigest()[:10]
            out_template = os.path.join(VIDEO_DIR, f"reel_{cand_id}.%(ext)s")

            print(f"[VIDEO_SEARCH] Downloading candidate '{cand_title[:45]}' ({cand.get('duration')}s)...")

            download_opts = {
                "ffmpeg_location": FFMPEG_PATH,
                "format": "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
                "merge_output_format": "mp4",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "noplaylist": True,
                "socket_timeout": 18,
                "max_filesize": 45 * 1024 * 1024,
            }

            try:
                with yt_dlp.YoutubeDL(download_opts) as ydl_d:
                    ydl_d.download([cand_url])

                cand_files = [f for f in os.listdir(VIDEO_DIR) if f.startswith(f"reel_{cand_id}") and not f.endswith(".part")]
                if cand_files:
                    cand_files.sort(key=lambda x: (x.endswith(".mp4"), os.path.getsize(os.path.join(VIDEO_DIR, x))), reverse=True)
                    actual_path = os.path.join(VIDEO_DIR, cand_files[0])
                    if os.path.exists(actual_path) and os.path.getsize(actual_path) > 20000:
                        ensured_path = ensure_h264_mp4(actual_path)
                        final_filename = os.path.basename(ensured_path)
                        v_info = get_video_info(ensured_path)
                        VIDEO_CACHE[cache_key] = {"filename": final_filename, "title": cand_title}
                        print(f"[VIDEO_SEARCH] Successfully fetched relatable news video: {final_filename} ('{cand_title[:45]}')")
                        return final_filename, cand_title, v_info
            except Exception as de:
                print(f"[VIDEO_SEARCH] Candidate download failed ({cand_title[:30]}): {de}. Retrying next...")
                for f in os.listdir(VIDEO_DIR):
                    if f.startswith(f"reel_{cand_id}") and f.endswith(".part"):
                        try: os.remove(os.path.join(VIDEO_DIR, f))
                        except: pass
                continue

    # Clean Fallback (if all internet searches failed, use sample_reel.mp4, NEVER a random roller coaster)
    sample_path = os.path.join(VIDEO_DIR, "sample_reel.mp4")
    if os.path.exists(sample_path) and os.path.getsize(sample_path) > 1000:
        v_info = get_video_info(sample_path)
        return "sample_reel.mp4", "News Background Motion Clip", v_info

    raise RuntimeError(f"Could not find or download relatable video footage for: {source_clean[:50]}")


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


# ==============================================================================
# 20 VIRAL REEL PATTERNS & DATASET CATALOG (News, Dark Memes, Reddit & Collabs)
# ==============================================================================
VIRAL_REEL_DATASET = [
    {
        "id": "reel_split",
        "name": "Split-Screen Breaking News Card",
        "category": "news",
        "theme": "Viral Breaking News / Headline Satire",
        "location": "Global Broadcast Feed",
        "pattern": "Top White Card → Breaking Badge → Punchline Lead → Motion Video Below",
        "shot_type": "Split-screen dual view",
        "pace": "Fast 8-12s loop",
        "audio_style": "Trending viral audio / phonk / news boom",
        "hook": "POV: YOU OPENED THE NEWS TODAY 💀",
        "caption": "When reality is written by a chaotic writer and we are just background characters.",
        "sub_badge": "WAIT TILL THE END 😭",
        "frame_design": "Clean high-contrast white card top, gradient divider, bottom video",
        "text_style": "Outfit 900 bold black & dark slate typography",
        "color_grade": "clean_hd",
        "quality_tip": "Crisp 1080p card text with pixel-perfect alignment (CRF 16)",
        "viral_element": "Instant curiosity gap + high save and share velocity",
        "icon": "📰"
    },
    {
        "id": "reel_chyron",
        "name": "Breaking TV Broadcast Chyron",
        "category": "news",
        "theme": "Live TV Broadcast Satire & Real-time Ticker",
        "location": "Live News Studio",
        "pattern": "🔴 LIVE Watermark → Red Lower-Third Bar → Breaking Banner → Animated Ticker",
        "shot_type": "Full video with live broadcast lower-third graphics",
        "pace": "Live broadcast flow 10-15s",
        "audio_style": "News dramatic boom sound / synth tension",
        "hook": "🔴 BREAKING: THE SIMULATION GLITCHED AGAIN",
        "caption": "Scientists report reality is unraveling, more details at 11.",
        "sub_badge": "HAPPENING RIGHT NOW 🚨",
        "frame_design": "Red lower-third bar + navy container + scrolling bottom marquee ticker",
        "text_style": "Impact & Outfit TV news bold typography",
        "color_grade": "news_vivid",
        "quality_tip": "Smooth 60fps ticker animation for realistic broadcast feel",
        "viral_element": "Parody authority + instant stopping power on Instagram explore",
        "icon": "📺"
    },
    {
        "id": "reel_unusual_whales",
        "name": "Market & Money Reality Satire",
        "category": "news",
        "theme": "Economic Truth & Savage Financial Satire",
        "location": "Wall Street Midnight Desk",
        "pattern": "Market Alert Pill → Dark Trading Card → Stock Ticker → Savage Reality Truth",
        "shot_type": "Dark financial terminal card over video loop",
        "pace": "Snappy 10-14s",
        "audio_style": "Deep bass boom with vinyl crackle",
        "hook": "BREAKING FINANCIAL UPDATE 📉",
        "caption": "We went from flying car dreams to paying monthly rent for heated car seats in our own cars 💀",
        "sub_badge": "MARKET DERAILMENT 💸",
        "frame_design": "Bloomberg terminal dark mode card with neon green/red ticker alert",
        "text_style": "Inter and monospace clean financial headline",
        "color_grade": "dark_oled",
        "quality_tip": "Keep card padding generous with high contrast text for readability",
        "viral_element": "Massive relatability regarding inflation & modern cost of living",
        "icon": "💸"
    },
    {
        "id": "reel_fake_notification",
        "name": "Shock Breaking Notification",
        "category": "news",
        "theme": "Urgent Push Notification Reality Check",
        "location": "Smartphone Lock Screen",
        "pattern": "Push Notification Popup → App Icon → Urgent Headline → Reality Reaction",
        "shot_type": "Floating iOS / Android blur card interrupting video footage",
        "pace": "Snappy 8-10s",
        "audio_style": "iPhone notification ping + dramatic bass drop",
        "hook": "URGENT SYSTEM NOTIFICATION 🔔",
        "caption": "Your 30-day free trial of being a calm adult has expired. Please upgrade or panic.",
        "sub_badge": "BREAKING ALERT 🚨",
        "frame_design": "Frosted glass floating push notification card with app icon and timestamp",
        "text_style": "San Francisco / Inter bold modern notification typography",
        "color_grade": "clean_hd",
        "quality_tip": "Instant 0.5s notification pop-in creates instant pause-scrolling",
        "viral_element": "Mimics real phone notifications, triggering immediate human attention",
        "icon": "🔔"
    },
    {
        "id": "reel_headline_reaction",
        "name": "Headline + Meme Reaction Collab",
        "category": "news",
        "theme": "Absurd News Headline + Shock Reaction",
        "location": "Viral Reaction Studio",
        "pattern": "Top Wild Headline Card → Dramatic Sound Cue → Bottom Absurd Reaction Video",
        "shot_type": "Vertical dual split reaction",
        "pace": "Punchy 6-9s quick loop",
        "audio_style": "Dramatic vine boom / funny meme audio",
        "hook": "THERE IS NO WAY THIS IS REAL 😭",
        "caption": "Every morning the news writers wake up and choose pure unscripted chaos.",
        "sub_badge": "WAIT FOR IT 💀",
        "frame_design": "Headline banner top with glowing border and full reaction video bottom",
        "text_style": "Outfit 900 bold black text on white header pill",
        "color_grade": "news_vivid",
        "quality_tip": "High contrast between top headline and bottom reaction clip",
        "viral_element": "Instant meme recognition + punchy humour",
        "icon": "🎭"
    },
    {
        "id": "reel_dark_humor",
        "name": "Existential Dark Meme",
        "category": "meme",
        "theme": "Dark Humor & Existential Dread",
        "location": "Midnight Void",
        "pattern": "Existential Setup → Dramatic Pause → Dark Truth Punchline → Relatable Despair",
        "shot_type": "Dimmed background footage with high-contrast text overlay",
        "pace": "Slow burn 8-12s loop",
        "audio_style": "Slowed + reverb melancholic lo-fi",
        "hook": "Smiling through the existential dread 🙂",
        "caption": "Just another completely normal day on planet Earth where everything is totally fine.",
        "sub_badge": "DARK HUMOR 💀",
        "frame_design": "Dark vignette frame with glowing blood red and slate accents",
        "text_style": "Outfit 900 stark white text with subtle drop shadow",
        "color_grade": "dark_oled",
        "quality_tip": "Deep black shadows with high dynamic range text highlights",
        "viral_element": "Massive Gen-Z nihilistic relatability and meme comment threads",
        "icon": "💀"
    },
    {
        "id": "reel_impact",
        "name": "Classic Savage Impact Meme",
        "category": "meme",
        "theme": "All-Caps Bold Savage Meme",
        "location": "Front Page Meme Desk",
        "pattern": "Giant Top Setup → High Energy Footage → Bottom Savage Punchline",
        "shot_type": "Full video with giant stroked text",
        "pace": "Fast 6-10s",
        "audio_style": "High energy phonk / trending meme sound",
        "hook": "ME TRYING TO FIX MY SLEEP SCHEDULE",
        "caption": "3:00 AM THOUGHTS ABOUT THE ROMAN EMPIRE AND EXISTENCE 💀",
        "sub_badge": "TOO RELATABLE 😭",
        "frame_design": "No borders, giant classic Impact typography with 10px black outline",
        "text_style": "Impact font, uppercase, pure white fill with heavy black stroke",
        "color_grade": "clean_hd",
        "quality_tip": "Crisp font rendering at native 1080p resolution",
        "viral_element": "Instant readability on mobile feeds without having to click",
        "icon": "💥"
    },
    {
        "id": "reel_simulation_glitch",
        "name": "Simulation Glitch Matrix",
        "category": "meme",
        "theme": "Sci-Fi Reality Glitch & Satire",
        "location": "Matrix Server Room",
        "pattern": "Matrix HUD → Glitch Scanlines → Absurd Event Breakdown → Simulation Reset",
        "shot_type": "Glitch VHS style over bizarre real-world footage",
        "pace": "Fast 8-12s",
        "audio_style": "Cyberpunk darksynth / digital glitch sound",
        "hook": "SIMULATION ERROR #404 ⚡",
        "caption": "The developers of Earth haven't released a patch update since 2019 and it shows.",
        "sub_badge": "GLITCH IN REALITY 👾",
        "frame_design": "Neon cyan & green matrix HUD brackets with scanline overlay",
        "text_style": "Monospace / Courier Prime bold tech typography with cyan glow",
        "color_grade": "neon_cyber",
        "quality_tip": "High-contrast neon glow falloff with sharp text edge",
        "viral_element": "Very popular among Gen-Z and tech audience, high comment debate",
        "icon": "👾"
    },
    {
        "id": "reel_tweet_dark",
        "name": "OLED Dark Mode Viral X Thread",
        "category": "meme",
        "theme": "Dark Mode Viral Tweet Commentary",
        "location": "X (Twitter) Midnight Feed",
        "pattern": "Profile Badge → Verified Check → Tweet Punchline → Views Counter",
        "shot_type": "Clean dark card over dimmed aesthetic background",
        "pace": "8-12s loop",
        "audio_style": "Ambient vinyl crackle with piano",
        "hook": "Nobody asked for this timeline:",
        "caption": "Can we fast forward to the part where aliens land and cancel our rent? 💀",
        "sub_badge": "VIRAL THREAD 🐦",
        "frame_design": "Ultra-sleek pitch black OLED card with blue checkmark and counters",
        "text_style": "Inter clean typography with highlighted timestamps and metrics",
        "color_grade": "dark_oled",
        "quality_tip": "Keep card padding generous for authentic tweet screenshot aesthetic",
        "viral_element": "Extremely shareable to Instagram Stories and DMs",
        "icon": "🐦"
    },
    {
        "id": "reel_savage_reality",
        "name": "Savage Reality Check",
        "category": "meme",
        "theme": "Brutally Honest Unhinged Advice",
        "location": "Reality Check Desk",
        "pattern": "Brutal Disclaimer → Honest Mirror Talk → Unfiltered Reality Punchline",
        "shot_type": "Dramatic high-contrast motion with golden text",
        "pace": "Steely 10-14s resolute pace",
        "audio_style": "Aggressive orchestral brass / phonk motivation",
        "hook": "FRIENDLY REMINDER: NOBODY CARES.",
        "caption": "They will judge you anyway, so you might as well fail doing what makes you happy.",
        "sub_badge": "BRUTAL TRUTH 🖤",
        "frame_design": "Dark vignette frame with gold and crimson accent stamps",
        "text_style": "Bebas Neue & Outfit 900 high contrast uppercase typography",
        "color_grade": "cinematic_contrast",
        "quality_tip": "Deep black shadows with high dynamic range gold highlights",
        "viral_element": "Save-for-later reality check + massive quote sharing",
        "icon": "🖤"
    },
    {
        "id": "reel_reddit_story",
        "name": "r/AskReddit Deep Thoughts",
        "category": "reddit",
        "theme": "Viral Reddit Question & Unfiltered Answers",
        "location": "Reddit Front Page",
        "pattern": "Subreddit Badge → Upvote Counter → Dilemma Question → Top Confession",
        "shot_type": "Narrative card over relaxing gameplay or background loop",
        "pace": "12-16s storytelling cadence",
        "audio_style": "Minecraft calm lo-fi / chill ambient",
        "hook": "What is a harsh truth nobody talks about?",
        "caption": "Nobody is coming to save you. Your peace and success are 100% your own responsibility.",
        "sub_badge": "r/AskReddit 🤖",
        "frame_design": "r/AskReddit pill, orange upvote counter, awards bar",
        "text_style": "Inter clean UI typography with clear visual hierarchy",
        "color_grade": "reddit_dark",
        "quality_tip": "Keep card backdrop semi-translucent over motion gameplay/nature",
        "viral_element": "Comments debating the answer + massive storytelling retention",
        "icon": "🤖"
    },
    {
        "id": "reel_reddit_confession",
        "name": "r/Confession Dark Secrets",
        "category": "reddit",
        "theme": "Anonymous Dramatic Reddit Confession",
        "location": "r/Confessions Midnight",
        "pattern": "Confession Banner → Anonymous Handle → Dramatic Setup → Unfiltered Reveal",
        "shot_type": "Floating dark narrative card with subtle slow zoom",
        "pace": "Suspenseful 12-16s",
        "audio_style": "Tense cinematic ambient piano",
        "hook": "I kept this secret for 8 years and today it came out...",
        "caption": "Sometimes the truth hurts, but living a lie costs your entire peace of mind.",
        "sub_badge": "r/Confessions 🤐",
        "frame_design": "Dark confession box with lock icon and anonymous user tag",
        "text_style": "Plus Jakarta Sans clean narrative typography",
        "color_grade": "reddit_dark",
        "quality_tip": "Story cadence keeps viewers hooked until the final 2 seconds",
        "viral_element": "Dramatic curiosity loop drives extreme watch time retention",
        "icon": "🤐"
    },
    {
        "id": "reel_reddit_aita",
        "name": "r/AITA Dramatic Storytime",
        "category": "reddit",
        "theme": "Moral Dilemma & Outrageous Drama",
        "location": "r/AmITheAsshole Thread",
        "pattern": "Judgment Badge [AITA?] → Bizarre Family/Work Dilemma → Crowd Reaction",
        "shot_type": "Story card over satisfying motion footage",
        "pace": "12-15s story pacing",
        "audio_style": "Lo-fi beat with soft guitar",
        "hook": "AITA for telling my boss what everyone actually thinks?",
        "caption": "The room went dead silent. Now I'm in HR and writing this on the company bathroom break.",
        "sub_badge": "r/AmITheAsshole 🚩",
        "frame_design": "Red flag badge, dilemma header, voting prompt at bottom",
        "text_style": "Inter bold modern layout with red and amber highlights",
        "color_grade": "reddit_dark",
        "quality_tip": "Clear bold hook in first 1.5 seconds prevents scrolling away",
        "viral_element": "Comments flood in with 'YTA' or 'NTA' judgments",
        "icon": "🚩"
    },
    {
        "id": "reel_mashup_montage",
        "name": "4-Clip Fast-Paced Montage",
        "category": "collab",
        "theme": "Multi-Clip Mashup & Rapid Transition Montage",
        "location": "Multi-Clip Video Editor",
        "pattern": "Clip 1 Hook (2s) → Clip 2 Build (3s) → Clip 3 Drop (3s) → Clip 4 Punchline (2s)",
        "shot_type": "Rapid 4-clip sequential montage cut",
        "pace": "Fast 10-12s beat-synced cuts",
        "audio_style": "Viral beat switch / Phonk drop / EDM build",
        "hook": "THIS TOOK A COMPLETE 180° TURN 🤯",
        "caption": "Watch till the final clip. The transition will melt your brain.",
        "sub_badge": "4-CLIP MASHUP 🎬",
        "frame_design": "Minimal top/bottom progress indicator with clip chapter markers",
        "text_style": "Outfit 900 high energy punchy bold text",
        "color_grade": "ai_sharp",
        "quality_tip": "AI quality enhancer removes blur across multi-source clips",
        "viral_element": "Extremely high rewatch rate to catch all 4 clips",
        "icon": "🎬"
    },
    {
        "id": "reel_brainrot_subway",
        "name": "Dual Screen Brainrot (Headline + Gameplay)",
        "category": "collab",
        "theme": "Split Screen Brainrot (Top News + Bottom Gameplay)",
        "location": "TikTok / Reels Algorithm Core",
        "pattern": "Top: News/Reddit Headline Video → Bottom: Satisfying Gameplay / Meme Loop",
        "shot_type": "50/50 Vertical split-screen collab",
        "pace": "Fast continuous stimulation",
        "audio_style": "Voiceover + subtle satisfying background audio",
        "hook": "HOW MODERN SOCIETY CONSUMES INFORMATION 🧠",
        "caption": "If the news doesn't have Subway Surfers under it, my brain physically rejects the information.",
        "sub_badge": "DUAL BRAINROT 📱",
        "frame_design": "50/50 horizontal divider bar with neon accent pulse",
        "text_style": "Impact & Outfit high contrast center banner",
        "color_grade": "clean_hd",
        "quality_tip": "Lanczos scaling keeps both top and bottom clips pin-sharp",
        "viral_element": "Highest engagement format on TikTok & Instagram Reels algorithms",
        "icon": "📱"
    },
    {
        "id": "reel_pip_commentary",
        "name": "PiP Reaction / Commentary Collab",
        "category": "collab",
        "theme": "Main Footage + Corner Reaction Webcam",
        "location": "Reaction Studio Deck",
        "pattern": "Full Screen Background Video + Floating Corner Webcam / Reaction Meme",
        "shot_type": "Picture-in-Picture floating reaction box",
        "pace": "Continuous 10-14s",
        "audio_style": "Commentary dialogue mixed with background audio",
        "hook": "LIVE REACTION TO THIS ABSOLUTE MADNESS 🎙️",
        "caption": "I don't even have words for what we just witnessed. Just look at this.",
        "sub_badge": "REACTION PIP 👁️",
        "frame_design": "Full screen main video with rounded border reaction card in corner",
        "text_style": "Modern streamer font with glowing accent border",
        "color_grade": "ai_sharp",
        "quality_tip": "Audio normalization ensures speech and clip levels match perfectly",
        "viral_element": "Human reaction facial expressions build immediate empathy & laughs",
        "icon": "👁️"
    },
    {
        "id": "reel_before_after",
        "name": "Expectation vs Reality / VS Collab",
        "category": "collab",
        "theme": "Relatable Irony & Life Contrast",
        "location": "Daily Reality",
        "pattern": "Top Green Pill (BEFORE) → Center VS Badge → Bottom Red Pill (AFTER)",
        "shot_type": "Two-tone comparison framing",
        "pace": "Punchy 6-9s quick loop",
        "audio_style": "Funny fail sound / viral audio switch",
        "hook": "HOW I PLANNED MY 2026:",
        "caption": "MY LIFE DECIDING TO RUN ON 1% BATTERY AND CHAOS INSTEAD 😭",
        "sub_badge": "EXPECTATION VS REALITY 🎭",
        "frame_design": "Dual expectation/reality badges with contrasting color accents",
        "text_style": "Outfit 900 bold black & white impact text",
        "color_grade": "clean_hd",
        "quality_tip": "Instant visual contrast creates immediate scroll-stopping power",
        "viral_element": "High relatable tagging: 'Bro this is literally you'",
        "icon": "🎭"
    },
    {
        "id": "reel_podcast_clip",
        "name": "Podcast Soundwave & Highlight Subtitles",
        "category": "creator",
        "theme": "Viral Interview & Mind-Blowing Revelation",
        "location": "Podcast Studio",
        "pattern": "Mic Pill → Floating Speaker Tag → Audio Waveform → Subtitle Box",
        "shot_type": "Dynamic speech clip",
        "pace": "Snappy speech pacing 10-15s",
        "audio_style": "Clear speech dialogue with subtle beat",
        "hook": "WAIT TILL HE EXPLAINS THIS 🤯",
        "caption": "“Most people are not afraid of failure. They are terrified of being seen trying.”",
        "sub_badge": "DEEP DIVE 🎙️",
        "frame_design": "Microphone badge, animated audio waveform visualizer, yellow highlight bar",
        "text_style": "Plus Jakarta Sans 800 with golden yellow keyword highlights",
        "color_grade": "clean_hd",
        "quality_tip": "Sync text punchiness with video pacing",
        "viral_element": "Podcast clips have highest watch-time retention on Reels",
        "icon": "🎙️"
    },
    {
        "id": "reel_retro_vhs",
        "name": "Retro 90s VHS Camcorder",
        "category": "creator",
        "theme": "Analog Nostalgia & Glitch Parody",
        "location": "1998 Analog Camcorder",
        "pattern": "PLAY Indicator → Timestamp → CRT Scanlines → Retro Punchline",
        "shot_type": "Vintage tape camcorder look",
        "pace": "Raw continuous footage with glitch cuts",
        "audio_style": "Tape hiss with retro synthwave",
        "hook": "MEMORIES FROM A GLITCHED UNIVERSE 📼",
        "caption": "OCT. 12 1998 • The world before algorithms told us how to think.",
        "sub_badge": "ANALOG VHS 📼",
        "frame_design": "Flashing REC dot, PLAY 00:14:28, tracking scanline overlay",
        "text_style": "Courier Prime retro monospace typography",
        "color_grade": "vintage_vhs",
        "quality_tip": "Subtle analog grain with chromatic cyan/magenta fringe",
        "viral_element": "90s nostalgia trend + Gen-Z retro aesthetic",
        "icon": "📼"
    },
    {
        "id": "reel_neon_cyberpunk",
        "name": "Cyberpunk Neon 2077 HUD",
        "category": "creator",
        "theme": "Sci-Fi Simulation & Futuristic Reality",
        "location": "Neo-Tokyo 2049",
        "pattern": "HUD Corner Brackets → Neon Glow Frame → Cybernetic Punchline",
        "shot_type": "Cyberpunk city / night motion",
        "pace": "Fast rhythmic cuts 8-12s",
        "audio_style": "Cyberpunk darksynth / industrial bass",
        "hook": "SYSTEM OVERRIDE // PROTOCOL 2077 ⚡",
        "caption": "You are not stuck in traffic. You are the traffic. Wake up samurai.",
        "sub_badge": "NEO TOKYO 2077 ⚡",
        "frame_design": "Electric cyan & neon magenta dual-tone glowing borders",
        "text_style": "Space Grotesk bold futuristic tech typography with neon drop shadow",
        "color_grade": "neon_cyber",
        "quality_tip": "High saturation with crisp neon glow falloff",
        "viral_element": "Visually striking electric contrast + futuristic dark humor",
        "icon": "⚡"
    }
]


def generate_news_reel_content(title, publisher="", category="", vibe="news", related_coverage=None):
    """
    Generates:
    1. Prominent Headline: 'BREAKING: {title}'
    2. 2-3 Line Factual News Description: Concise summary synthesized from related coverage & headline.
    3. Relatable Video Search Queries for finding real news footage.
    """
    title_clean = ' '.join(title.split()).strip()

    # Build headline with BREAKING prefix
    headline_clean = title_clean
    if not headline_clean.upper().startswith("BREAKING"):
        headline_with_prefix = f"BREAKING: {headline_clean}"
    else:
        headline_with_prefix = headline_clean

    # Extract related coverage texts
    related_texts = []
    if related_coverage and isinstance(related_coverage, list):
        for r in related_coverage:
            if isinstance(r, dict):
                r_title = r.get("title", "").strip()
                r_pub = r.get("publisher", "").strip()
                if r_title:
                    related_texts.append(f"- {r_title} ({r_pub})" if r_pub else f"- {r_title}")
            elif isinstance(r, str) and r.strip():
                related_texts.append(f"- {r.strip()}")

    related_context = "\n".join(related_texts) if related_texts else "None"

    prompt = f"""You are a senior broadcast news editor and short-form video producer.
Main News Headline: "{title_clean}"
Publisher/Source: "{publisher}"
Category: "{category}"
Related Coverage from other major outlets:
{related_context}

Create a factual, high-impact 9:16 News Reel script following these exact requirements:
1. "headline": Must start with "BREAKING: " followed by the factual news headline: "{title_clean}". (Do NOT make joke memes or replace it with generic text).
2. "description": A concise, factual 2 to 3 line news description summarizing the story and related developments (e.g. key impact, quotes, actions taken, or dilemma). Length: 2 to 3 short sentences, max 220 characters.
3. "sub_badge": A relevant live badge (e.g. "🔴 BREAKING NEWS", "⚡ DEVELOPING STORY", "GLOBAL REPORT").
4. "search_queries": An array of 3 specific search queries for finding relatable news b-roll footage of this exact event on YouTube (e.g. key locations, military/political entities, news b-roll).
5. "ig_caption": An engaging Instagram Reel caption with the headline, description, and 6-8 relevant news hashtags.

Respond ONLY with valid JSON:
{{
  "headline": "{headline_with_prefix}",
  "description": "2-3 lines of factual news description...",
  "sub_badge": "🔴 BREAKING NEWS",
  "search_queries": ["query 1", "query 2", "query 3"],
  "ig_caption": "{headline_with_prefix}\\n\\n[Description]\\n\\nFollow @today_memer for real-time global news updates.",
  "hashtags": "#breakingnews #worldnews #news"
}}"""

    raw = call_groq_chat([
        {"role": "system", "content": "You are a broadcast news editor. Output strictly valid JSON with factual headline and 2-3 line description."},
        {"role": "user", "content": prompt}
    ], max_tokens=800, temperature=0.7)

    if raw:
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)
            clean = re.sub(r',\s*([\]}])', r'\1', clean)
            try:
                parsed = json.loads(clean, strict=False)
            except Exception:
                m = re.search(r'(\{.*\})', clean, re.DOTALL)
                if m:
                    clean_m = re.sub(r',\s*([\]}])', r'\1', m.group(1))
                    parsed = json.loads(clean_m, strict=False)
                else:
                    raise
            if parsed.get("headline") and parsed.get("description"):
                if not parsed["headline"].upper().startswith("BREAKING"):
                    parsed["headline"] = f"BREAKING: {parsed['headline']}"
                return parsed
        except Exception as e:
            print(f"[GROQ] Error parsing news reel content: {e}")

    # Fallback when Groq is unavailable or parsing fails
    if related_texts:
        clean_rels = [re.sub(r"^[-\s]+", "", rt).split("(")[0].strip() for rt in related_texts]
        if len(clean_rels) >= 2:
            desc = f"{clean_rels[0]}. {clean_rels[1]}."
        else:
            desc = f"{clean_rels[0]}. Official sources are closely tracking new developments."
    else:
        desc = f"Reports from {publisher or 'major news outlets'} confirm significant developments regarding {title_clean}. International officials are monitoring the situation as events unfold."

    search_qs = extract_news_search_queries(title_clean, related_coverage)

    return {
        "headline": headline_with_prefix,
        "description": desc,
        "sub_badge": "🔴 BREAKING NEWS",
        "search_queries": search_qs,
        "ig_caption": f"{headline_with_prefix}\n\n{desc}\n\nStay tuned for ongoing coverage and updates.\n\nFollow for daily breaking news.",
        "hashtags": "#breakingnews #worldnews #globalnews #reels #trending #news"
    }


def generate_reel_hooks(title, publisher="", category="", vibe="news", related_coverage=None):
    """
    Generate factual 9:16 Reel headline ('BREAKING: ...') and 2-3 line news description.
    """
    content = generate_news_reel_content(title, publisher, category, vibe, related_coverage)
    headline = content.get("headline") or (f"BREAKING: {title}" if not title.upper().startswith("BREAKING") else title)
    description = content.get("description") or title
    sub_badge = content.get("sub_badge") or "🔴 BREAKING NEWS"
    search_queries = content.get("search_queries") or []
    ig_caption = content.get("ig_caption") or f"{headline}\n\n{description}\n\nFollow for daily breaking news updates."
    hashtags = content.get("hashtags") or "#breakingnews #worldnews #reels #viral #trending #todaynews"

    hooks_list = [
        {
            "layout": "reel_split",
            "top_hook": headline,
            "caption": description,
            "sub_badge": sub_badge,
            "vibe": "Breaking News"
        },
        {
            "layout": "reel_chyron",
            "top_hook": headline,
            "caption": description,
            "sub_badge": "🔴 LIVE TV REPORT",
            "vibe": "Live Broadcast"
        },
        {
            "layout": "reel_dark_humor",
            "top_hook": headline,
            "caption": description,
            "sub_badge": "🔴 BREAKING NEWS",
            "vibe": "News Reel"
        },
        {
            "layout": "reel_glass_card",
            "top_hook": headline,
            "caption": description,
            "sub_badge": "GLOBAL FEED",
            "vibe": "POV News"
        }
    ]

    return {
        "headline": headline,
        "description": description,
        "publisher": publisher,
        "category": category,
        "sub_badge": sub_badge,
        "search_queries": search_queries,
        "hooks": hooks_list,
        "caption": ig_caption,
        "hashtags": hashtags
    }


def generate_batch_reel_hooks(articles, vibe="news"):
    """
    Extracts factual breaking news headlines, 2-3 line descriptions, and targeted video search queries for multiple news items.
    """
    results = []
    for idx, item in enumerate(articles):
        title = item.get("title", "").strip()
        pub = item.get("publisher", "").strip()
        cat = item.get("category", "").strip()
        manual_url = item.get("manual_video_url", "").strip()
        custom_layout = item.get("layout", "").strip()
        related_cov = item.get("related_coverage", [])

        hooks_data = generate_reel_hooks(title, pub, cat, vibe, related_coverage=related_cov)
        headline = hooks_data.get("headline") or (f"BREAKING: {title}" if not title.upper().startswith("BREAKING") else title)
        description = hooks_data.get("description") or title
        sub_badge = hooks_data.get("sub_badge") or "🔴 BREAKING NEWS"
        search_queries = hooks_data.get("search_queries") or []
        hooks_list = hooks_data.get("hooks", [])
        lead = hooks_list[0] if hooks_list else {}
        chosen_layout = custom_layout or lead.get("layout") or "reel_split"

        search_kw = search_queries[0] if search_queries else title[:35]
        ig_caption = hooks_data.get("caption") or f"{headline}\n\n{description}\n\nStay tuned for real-time global news updates."
        hashtags = hooks_data.get("hashtags") or "#news #reels #viral #trending #todaynews"

        results.append({
            "index": idx,
            "title": title,
            "publisher": pub,
            "category": cat,
            "top_hook": headline,
            "description": description,
            "sub_badge": sub_badge,
            "layout": chosen_layout,
            "search_query": search_kw,
            "search_queries": search_queries,
            "manual_video_url": manual_url,
            "ig_caption": ig_caption,
            "hashtags": hashtags,
            "hooks": hooks_list
        })
    return results


def check_video_has_audio(vid_path):
    try:
        cmd = [FFMPEG_PATH, "-i", vid_path]
        res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, timeout=10)
        return b"Audio:" in res.stderr
    except Exception:
        return False


def compose_multi_clip_reel(
    clips=None,
    vid_name="sample_reel.mp4",
    overlay_data="",
    layout="reel_split",
    duration=12,
    quality="hd1080",
    color_grade="none",
    collab_mode="single",
    quality_enhancement=True
):
    """
    Composites 1, 2, 3, or 4 video clips into a high-octane 9:16 Reel.
    Supports Collab Mashup modes:
      - 'sequence': Sequential multi-clip mashup montage (Clip 1 -> Clip 2 -> Clip 3 -> Clip 4)
      - 'split2': Top/Bottom 50-50 vertical split-screen collab (e.g. News + Subway Surfers/Meme)
      - 'split4': Quad 2x2 grid collage collab
      - 'pip': Picture-in-Picture floating reaction webcam box over main video
      - 'single': Single video enhanced with Lanczos & overlay
    AI Quality Enhancement:
      - Unsharp contrast adaptive sharpening
      - High dynamic range color vibrance pop
      - Dual-pass audio loudnorm normalization
      - 1080x1920 Full HD 60fps CRF 16 Master export with Faststart
    """
    resolved_clips = []
    if clips and isinstance(clips, list):
        for c in clips:
            c_name = c.get("filename") if isinstance(c, dict) else str(c)
            c_path = os.path.join(VIDEO_DIR, os.path.basename(c_name)) if c_name else ""
            if c_path and os.path.exists(c_path) and os.path.getsize(c_path) > 1000:
                resolved_clips.append(c_path)

    if not resolved_clips:
        single_path = os.path.join(VIDEO_DIR, os.path.basename(vid_name)) if vid_name else ""
        if not single_path or not os.path.exists(single_path) or os.path.getsize(single_path) < 1000:
            single_path = os.path.join(VIDEO_DIR, "sample_reel.mp4")
        resolved_clips = [single_path]

    timestamp = int(time.time())
    overlay_path = os.path.join(VIDEO_DIR, f"temp_overlay_{timestamp}.png")

    if "," in overlay_data:
        overlay_data = overlay_data.split(",", 1)[1]
    with open(overlay_path, "wb") as f:
        f.write(base64.b64decode(overlay_data))

    out_name = f"composed_reel_{timestamp}.mp4"
    out_path = os.path.join(VIDEO_DIR, out_name)

    target_w, target_h = (1080, 1920) if quality == "hd1080" else (720, 1280)

    # Color Grade Chains
    cg_filter_map = {
        "clean_hd": "eq=contrast=1.08:saturation=1.15,unsharp=5:5:1.0:5:5:0.0",
        "ai_sharp": "unsharp=5:5:1.4:5:5:0.3,eq=contrast=1.15:brightness=0.01:saturation=1.20",
        "dark_oled": "eq=contrast=1.35:brightness=-0.04:saturation=1.10",
        "cinematic_contrast": "eq=contrast=1.24:saturation=1.18:brightness=-0.02,unsharp=5:5:0.8:5:5:0.0",
        "reddit_dark": "eq=contrast=1.20:brightness=-0.03:saturation=1.05",
        "vintage_vhs": "eq=saturation=1.25:contrast=1.15:brightness=0.02",
        "neon_cyber": "eq=contrast=1.25:saturation=1.35:brightness=0.01",
        "news_vivid": "eq=contrast=1.12:saturation=1.22:brightness=0.02",
        "golden_film": "eq=contrast=1.14:brightness=0.02:saturation=1.28,colorbalance=rs=0.15:gs=0.05:bs=-0.12",
        "warm_saffron": "eq=contrast=1.14:brightness=0.03:saturation=1.30",
        "heaven_clouds": "eq=contrast=1.06:brightness=0.06:saturation=1.15",
        "none": ""
    }
    cg_raw = cg_filter_map.get(color_grade, "")
    grade_step = f"{cg_raw}," if cg_raw else ""

    # AI Quality Enhancer (Sharpness & HDR Pop)
    enh_step = "unsharp=5:5:1.2:5:5:0.2,eq=contrast=1.12:brightness=0.01:saturation=1.18," if quality_enhancement else ""

    num_clips = len(resolved_clips)
    ovl_input_idx = num_clips
    cmd_inputs = []

    for c_path in resolved_clips:
        cmd_inputs.extend(["-i", c_path])
    cmd_inputs.extend(["-i", overlay_path])

    filter_complex = ""
    map_audio_label = "[norm_a]"

    if collab_mode == "sequence" and num_clips > 1:
        # Sequential Mashup / Montage of 2 to 4 clips
        seg_dur = round(max(2.0, float(duration) / num_clips), 2)
        v_segs = []
        a_segs = []

        for i, c_path in enumerate(resolved_clips):
            v_segs.append(f"[{i}:v]trim=0:{seg_dur},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{target_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{target_h}[v{i}]")
            if check_video_has_audio(c_path):
                a_segs.append(f"[{i}:a]atrim=0:{seg_dur},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[a{i}]")
            else:
                a_segs.append(f"anullsrc=channel_layout=stereo:sample_rate=48000:d={seg_dur}[a{i}]")

        cat_inputs = "".join(f"[v{i}][a{i}]" for i in range(num_clips))
        concat_part = f"{cat_inputs}concat=n={num_clips}:v=1:a=1[base_v][cat_a]"
        audio_norm_part = "[cat_a]loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        overlay_part = f"[{ovl_input_idx}:v]scale={target_w}:{target_h}:flags=lanczos[ovl_s];[base_v][ovl_s]overlay=0:0[v]"

        filter_complex = ";".join(v_segs + a_segs) + ";" + concat_part + ";" + audio_norm_part + ";" + overlay_part

    elif collab_mode == "split2" and num_clips >= 2:
        # Dual Split-Screen Collab (Top clip + Bottom clip)
        half_h = target_h // 2
        clip0_audio = check_video_has_audio(resolved_clips[0])
        clip1_audio = check_video_has_audio(resolved_clips[1])

        v_filter = (
            f"[0:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{half_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{half_h}[v_top];"
            f"[1:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{half_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{half_h}[v_bot];"
            f"[v_top][v_bot]vstack=inputs=2[base_v];"
            f"[{ovl_input_idx}:v]scale={target_w}:{target_h}:flags=lanczos[ovl_s];"
            f"[base_v][ovl_s]overlay=0:0[v]"
        )

        if clip0_audio and clip1_audio:
            a_filter = f"[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        elif clip0_audio:
            a_filter = f"[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        elif clip1_audio:
            a_filter = f"[1:a]loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        else:
            a_filter = f"anullsrc=channel_layout=stereo:sample_rate=48000:d={duration}[norm_a]"

        filter_complex = f"{v_filter};{a_filter}"

    elif collab_mode == "pip" and num_clips >= 2:
        # Picture-in-Picture Reaction Collab
        pip_w = int(target_w * 0.40)
        pip_h = int(pip_w * 1.33)
        pip_x = target_w - pip_w - 36
        pip_y = target_h - pip_h - 120

        clip0_audio = check_video_has_audio(resolved_clips[0])
        clip1_audio = check_video_has_audio(resolved_clips[1])

        v_filter = (
            f"[0:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{target_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{target_h}[v_main];"
            f"[1:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}scale={pip_w}:{pip_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={pip_w}:{pip_h}[v_pip];"
            f"[v_main][v_pip]overlay={pip_x}:{pip_y}[base_v];"
            f"[{ovl_input_idx}:v]scale={target_w}:{target_h}:flags=lanczos[ovl_s];"
            f"[base_v][ovl_s]overlay=0:0[v]"
        )

        if clip0_audio and clip1_audio:
            a_filter = f"[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        elif clip0_audio:
            a_filter = f"[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        else:
            a_filter = f"anullsrc=channel_layout=stereo:sample_rate=48000:d={duration}[norm_a]"

        filter_complex = f"{v_filter};{a_filter}"

    else:
        # Single Video / Split News Layout
        has_audio = check_video_has_audio(resolved_clips[0])
        if layout == "reel_split":
            card_h = int(510 * (target_h / 1280))
            vid_h = target_h - card_h
            v_filter = (
                f"color=c=black:s={target_w}x{target_h}:r=30[bg];"
                f"[0:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{vid_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{vid_h}[vid];"
                f"[bg][vid]overlay=0:{card_h}:shortest=1[base];"
                f"[1:v]scale={target_w}:{target_h}:flags=lanczos[ovl];"
                f"[base][ovl]overlay=0:0[v]"
            )
        else:
            v_filter = (
                f"[0:v]trim=0:{duration},setpts=PTS-STARTPTS,{enh_step}{grade_step}scale={target_w}:{target_h}:flags=lanczos:force_original_aspect_ratio=increase,crop={target_w}:{target_h}[vid];"
                f"[1:v]scale={target_w}:{target_h}:flags=lanczos[ovl];"
                f"[vid][ovl]overlay=0:0[v]"
            )

        if has_audio:
            a_filter = f"[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[norm_a]"
        else:
            a_filter = f"anullsrc=channel_layout=stereo:sample_rate=48000:d={duration}[norm_a]"

        filter_complex = f"{v_filter};{a_filter}"

    crf_val = "16" if quality == "hd1080" else "19"
    bitrate = "10M" if quality == "hd1080" else "5M"
    preset = "medium" if quality == "hd1080" else "veryfast"

    cmd = [FFMPEG_PATH, "-y"]
    cmd.extend(cmd_inputs)
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-map", map_audio_label,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", preset,
        "-crf", crf_val,
        "-b:v", bitrate,
        "-maxrate", "14M",
        "-bufsize", "18M",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-t", str(duration),
        "-movflags", "+faststart",
        out_path
    ])

    print(f"[COMPOSE] Running multi-clip FFmpeg command for {len(resolved_clips)} clip(s), mode={collab_mode}, quality={quality}...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90)

    # Clean up temp overlay
    if os.path.exists(overlay_path):
        try: os.remove(overlay_path)
        except Exception: pass

    if res.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) < 1000:
        err = res.stderr.decode("utf-8", errors="ignore")
        print(f"[COMPOSE] Error running FFmpeg: {err}")
        raise RuntimeError(f"FFmpeg composite failed: {err[:250]}")

    print(f"[COMPOSE] Successfully generated 9:16 HD Collab Reel ({quality}, {collab_mode}): {out_name} (size={os.path.getsize(out_path)} bytes)")
    return out_name, out_path


# Backward compatible alias for existing single video callers (Instagram publish, etc.)
def compose_reel_video(vid_name, overlay_data, layout="reel_split", duration=12, quality="hd1080", color_grade="none", clips=None, collab_mode="single", quality_enhancement=True):
    return compose_multi_clip_reel(
        clips=clips,
        vid_name=vid_name,
        overlay_data=overlay_data,
        layout=layout,
        duration=duration,
        quality=quality,
        color_grade=color_grade,
        collab_mode=collab_mode,
        quality_enhancement=quality_enhancement
    )


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

        # 20 Viral Reel patterns, hooks, and quality dataset
        if path == "/api/reel-dataset":
            return self.send_json({
                "success": True,
                "total": len(VIRAL_REEL_DATASET),
                "patterns": VIRAL_REEL_DATASET
            })

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
                payload = json.loads(post_body.decode("utf-8"), strict=False)
            except Exception:
                payload = {}

            title = payload.get("title", "")
            publisher = payload.get("publisher", "")
            category = payload.get("category", "")
            vibe = payload.get("vibe", "news")
            related_coverage = payload.get("related_coverage", [])
            return self.send_json(generate_reel_hooks(title, publisher, category, vibe, related_coverage=related_coverage))

        # Batch Generate Reel Hooks for multiple news items
        if path == "/api/batch-reel-hooks":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"), strict=False)
            except Exception:
                payload = {}

            articles = payload.get("articles", [])
            vibe = payload.get("vibe", "news")
            if not articles or not isinstance(articles, list):
                return self.send_json({"error": "A list of articles is required for batch hook extraction"}, status=400)

            batch_results = generate_batch_reel_hooks(articles, vibe=vibe)
            return self.send_json({
                "success": True,
                "count": len(batch_results),
                "items": batch_results
            })

        # Generate viral Instagram caption with Groq AI
        if path == "/api/ai-caption":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"), strict=False)
            except Exception:
                payload = {}

            title = payload.get("title", "")
            publisher = payload.get("publisher", "")
            hook = payload.get("hook", "")
            vibe = payload.get("vibe", "news")
            return self.send_json(generate_ai_caption(title, publisher, hook, vibe))

        # Fetch / Search Video Reel from Instagram, YouTube, or web
        if path == "/api/fetch-reel-video":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"), strict=False)
            except Exception:
                payload = {}

            source_url = payload.get("url", "").strip()
            query = payload.get("query", "").strip()
            search_queries = payload.get("search_queries", [])
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
                filename, title, vid_info = fetch_or_search_video(
                    target,
                    is_search=(mode == "search"),
                    related_queries=search_queries
                )
                return self.send_json({
                    "success": True,
                    "videoUrl": f"/api/serve-video?name={filename}",
                    "title": title,
                    "videoInfo": vid_info
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

            # Ensure H.264 MP4 conversion if needed
            ensured_path = ensure_h264_mp4(target_path)
            ensured_filename = os.path.basename(ensured_path)
            vid_info = get_video_info(ensured_path)

            return self.send_json({
                "success": True,
                "filename": ensured_filename,
                "videoUrl": f"/api/serve-video?name={ensured_filename}",
                "title": "Uploaded Video",
                "videoInfo": vid_info
            })

        # Fetch Multiple Video URLs (1 to 4 Clips) for Multi-Clip Collab Studio
        if path == "/api/fetch-multi-videos":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            urls = payload.get("urls", [])
            if not isinstance(urls, list) or not urls:
                return self.send_json({"error": "List of video URLs is required"}, status=400)

            clean_urls = [str(u).strip() for u in urls[:4] if str(u).strip()]
            if not clean_urls:
                return self.send_json({"error": "No valid URLs provided"}, status=400)

            from concurrent.futures import ThreadPoolExecutor

            def fetch_single_clip(idx, clean_url):
                try:
                    filename, title, vid_info = fetch_or_search_video(clean_url, is_search=False)
                    return {
                        "id": f"clip_{idx}",
                        "filename": filename,
                        "videoUrl": f"/api/serve-video?name={filename}",
                        "title": title,
                        "videoInfo": vid_info,
                        "originalUrl": clean_url
                    }
                except Exception as e:
                    print(f"[MULTI-FETCH] Error fetching clip {idx} ({clean_url[:40]}): {e}")
                    sample_name = "sample_reel.mp4"
                    return {
                        "id": f"clip_{idx}",
                        "filename": sample_name,
                        "videoUrl": f"/api/serve-video?name={sample_name}",
                        "title": f"Clip {idx + 1} (Fallback)",
                        "videoInfo": get_video_info(os.path.join(VIDEO_DIR, sample_name)),
                        "originalUrl": clean_url,
                        "error": str(e)
                    }

            with ThreadPoolExecutor(max_workers=min(4, len(clean_urls))) as executor:
                futures = [executor.submit(fetch_single_clip, idx, u) for idx, u in enumerate(clean_urls)]
                results = [f.result() for f in futures]

            return self.send_json({
                "success": True,
                "clips": results,
                "count": len(results)
            })

        # Render & Composite 9:16 Reel Video (Single Video or Multi-Clip Collab Mashup)
        if path == "/api/render-reel-video":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                payload = json.loads(post_body.decode("utf-8"))
            except Exception:
                payload = {}

            video_name = payload.get("video_name", "")
            clips = payload.get("clips", [])
            collab_mode = payload.get("collab_mode", "sequence" if (clips and len(clips) > 1) else "single")
            quality_enhancement = bool(payload.get("quality_enhancement", True))
            overlay = payload.get("overlay", "")
            layout = payload.get("layout", "reel_split")
            duration = int(payload.get("duration", 12))
            quality = payload.get("quality", "hd1080")
            color_grade = payload.get("color_grade", "none")

            if not overlay:
                return self.send_json({"error": "Overlay graphic is required to render reel"}, status=400)

            try:
                out_name, out_path = compose_multi_clip_reel(
                    clips=clips,
                    vid_name=video_name,
                    overlay_data=overlay,
                    layout=layout,
                    duration=duration,
                    quality=quality,
                    color_grade=color_grade,
                    collab_mode=collab_mode,
                    quality_enhancement=quality_enhancement
                )
                vid_info = get_video_info(out_path)
                return self.send_json({
                    "success": True,
                    "filename": out_name,
                    "videoUrl": f"/api/serve-video?name={out_name}",
                    "title": "Rendered 9:16 HD Collab Reel",
                    "collab_mode": collab_mode,
                    "videoInfo": vid_info
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
        ServerClass = getattr(http.server, "ThreadingHTTPServer", http.server.HTTPServer)
        httpd = ServerClass(server_address, NewsServerHandler)
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
