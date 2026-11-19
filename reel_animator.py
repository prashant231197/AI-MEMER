"""
AI Reel-to-Animation Meme Creator (reel_animator.py)
Transforms Instagram Reels / Videos into Viral Animated Memes (Anime/Comic + Real Climax).
Features:
- Local ONNX Runtime (AnimeGANv2 Hayao & FacePaint)
- Hugging Face Space (akhaliq/AnimeGANv2 with user's HF_TOKEN)
- OpenCV Cel-Shading & Manga Speed-Lines
- Dynamic Ken Burns Zoom & Beat-Drop Audio Transitions
- Segoe UI Emoji & Full Color Meme Headers
"""

import os
import sys
import time
import math
import wave
import shutil
import random
import subprocess
import threading
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUT_DIR = os.path.join(BASE_DIR, "media", "videos")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

try:
    import imageio_ffmpeg
    FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_BIN = "ffmpeg"

_ONNX_SESSIONS = {}
_HF_CLIENT = None
ANIMATOR_JOBS = {}

def get_hf_token():
    token = os.environ.get("HF_TOKEN")
    if not token and os.path.exists(os.path.join(BASE_DIR, ".env")):
        with open(os.path.join(BASE_DIR, ".env"), "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("HF_TOKEN="):
                    token = line.strip().split("=", 1)[1]
                    break
    return token

def get_onnx_session(model_name="face_paint_512_v2_0.onnx"):
    global _ONNX_SESSIONS
    if model_name in _ONNX_SESSIONS:
        return _ONNX_SESSIONS[model_name]
    
    import onnxruntime as ort
    model_path = os.path.join(MODELS_DIR, model_name)
    if not os.path.exists(model_path):
        from huggingface_hub import hf_hub_download
        token = get_hf_token()
        repo = "akhaliq/AnimeGANv2-ONNX" if "face_paint" in model_name else "frankminors123/AnimeGAN_Hayao_Style_ONNX"
        model_path = hf_hub_download(repo_id=repo, filename=model_name, local_dir=MODELS_DIR, token=token)
    
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    _ONNX_SESSIONS[model_name] = sess
    return sess

def get_hf_client():
    global _HF_CLIENT
    if _HF_CLIENT is not None:
        return _HF_CLIENT
    try:
        from gradio_client import Client
        token = get_hf_token()
        _HF_CLIENT = Client("akhaliq/AnimeGANv2", token=token)
        return _HF_CLIENT
    except Exception as e:
        print(f"[HF Client Init Error] {e}")
        return None

def stylize_frame_hf(img_bgr, version="Version 2"):
    """
    Stylize via Hugging Face akhaliq/AnimeGANv2 Space.
    """
    try:
        client = get_hf_client()
        if not client:
            return stylize_frame_animegan(img_bgr)
            
        import tempfile
        from gradio_client import handle_file
        
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
        cv2.imwrite(tmp_path, img_bgr)
        
        res = client.predict(
            image=handle_file(tmp_path),
            version=version,
            api_name="/convert"
        )
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            
        # Result can be a path or dict
        if isinstance(res, dict) and "image_data" in res:
            import base64
            b64_data = res["image_data"].split(",", 1)[1]
            img_bytes = base64.b64decode(b64_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(res, str) and os.path.exists(res):
            return cv2.imread(res)
        return stylize_frame_animegan(img_bgr)
    except Exception as e:
        print(f"[HF Stylize Error] {e}, fallback to local ONNX")
        return stylize_frame_animegan(img_bgr)

def stylize_frame_animegan(img_bgr, model_name="face_paint_512_v2_0.onnx"):
    try:
        sess = get_onnx_session(model_name)
        input_meta = sess.get_inputs()[0]
        input_name = input_meta.name
        shape = input_meta.shape
        
        orig_h, orig_w = img_bgr.shape[:2]
        target_w = shape[3] if isinstance(shape[3], int) else 512
        target_h = shape[2] if isinstance(shape[2], int) else 512

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(img_rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)
        norm = (resized.astype(np.float32) / 127.5) - 1.0
        inp = np.transpose(norm, (2, 0, 1))[np.newaxis, ...]
        
        out = sess.run(None, {input_name: inp})[0]
        out_img = ((out[0].transpose(1, 2, 0) + 1.0) * 127.5).clip(0, 255).astype(np.uint8)
        out_bgr = cv2.cvtColor(out_img, cv2.COLOR_RGB2BGR)
        return cv2.resize(out_bgr, (orig_w, orig_h), interpolation=cv2.INTER_LANCZOS4)
    except Exception as e:
        print(f"[AnimeGAN Error] {e}, falling back to OpenCV cel-shading")
        return stylize_frame_opencv(img_bgr)

def stylize_frame_opencv(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray_blur = cv2.medianBlur(gray, 7)
    edges = cv2.adaptiveThreshold(gray_blur, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 7)
    
    color = img_bgr
    for _ in range(2):
        color = cv2.bilateralFilter(color, d=9, sigmaColor=75, sigmaSpace=75)
        
    edges_color = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    cartoon = cv2.bitwise_and(color, edges_color)
    
    hsv = cv2.cvtColor(cartoon, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.35, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.08, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

def draw_manga_speed_lines(frame_bgr, intensity=0.32, seed=0):
    h, w = frame_bgr.shape[:2]
    overlay = np.zeros((h, w, 4), dtype=np.uint8)
    center_x, center_y = w // 2, h // 2
    
    rng = random.Random(seed)
    num_lines = 45
    radius_min = min(w, h) * 0.30
    radius_max = max(w, h) * 0.95
    
    for _ in range(num_lines):
        angle = rng.uniform(0, 2 * math.pi)
        line_w = rng.randint(2, 5)
        alpha = int(rng.uniform(140, 240) * intensity)
        
        x1 = int(center_x + radius_min * math.cos(angle))
        y1 = int(center_y + radius_min * math.sin(angle))
        x2 = int(center_x + radius_max * math.cos(angle))
        y2 = int(center_y + radius_max * math.sin(angle))
        
        cv2.line(overlay, (x1, y1), (x2, y2), (255, 255, 255, alpha), line_w, cv2.LINE_AA)
        
    alpha_mask = overlay[:, :, 3].astype(np.float32) / 255.0
    for c in range(3):
        frame_bgr[:, :, c] = np.clip(
            frame_bgr[:, :, c] * (1.0 - alpha_mask) + overlay[:, :, c] * alpha_mask, 
            0, 255
        ).astype(np.uint8)
    return frame_bgr

def get_system_font(size=36, emoji=False):
    if emoji and os.path.exists("C:\\Windows\\Fonts\\seguiemj.ttf"):
        try:
            return ImageFont.truetype("C:\\Windows\\Fonts\\seguiemj.ttf", size)
        except Exception:
            pass
    for name in ["arialbd.ttf", "arial.ttf", "segoeui.ttf"]:
        path = os.path.join("C:\\Windows\\Fonts", name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_comic_badge(frame_bgr, text="AURA +9999 💀🔥", pos="top_left"):
    pil_img = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)
    
    font = get_system_font(size=34, emoji=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    w, h = pil_img.size
    pad_x, pad_y = 20, 10
    
    if pos == "top_left":
        x, y = 35, 40
    elif pos == "center":
        x, y = (w - tw - pad_x * 2) // 2, (h - th - pad_y * 2) // 2
    else:
        x, y = (w - tw - pad_x * 2) // 2, h - th - pad_y * 2 - 40
        
    bg_box = [x, y, x + tw + pad_x * 2, y + th + pad_y * 2]
    
    draw.rounded_rectangle([b + 4 for b in bg_box], radius=14, fill=(10, 10, 10, 200))
    draw.rounded_rectangle(bg_box, radius=14, fill=(255, 220, 0), outline=(220, 20, 60), width=4)
    draw.text((x + pad_x, y + pad_y), text, fill=(15, 15, 15), font=font, embedded_color=True)
    
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def create_cinematic_boom(duration=1.8, sample_rate=44100):
    boom_path = os.path.join(MODELS_DIR, "cinematic_boom.wav")
    if os.path.exists(boom_path):
        return boom_path
        
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    f_sweep = 35.0 + 145.0 * np.exp(-4.0 * t)
    phase = 2 * np.pi * np.cumsum(f_sweep) / sample_rate
    sine_wave = np.sin(phase)
    envelope = np.exp(-2.2 * t)
    noise = np.random.normal(0, 0.12, len(t)) * np.exp(-7.0 * t)
    
    audio = (sine_wave * envelope + noise) * 0.85
    audio_int16 = (audio * 32767).clip(-32768, 32767).astype(np.int16)
    
    with wave.open(boom_path, "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(audio_int16.tobytes())
    return boom_path

def download_reel(url, out_dir=None):
    import yt_dlp
    if not out_dir:
        out_dir = OUTPUT_DIR
    out_tmpl = os.path.join(out_dir, "reel_dl_%(id)s.%(ext)s")
    
    ydl_opts = {
        "format": "bestvideo+bestaudio/best",
        "outtmpl": out_tmpl,
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        base, _ = os.path.splitext(filename)
        mp4_path = base + ".mp4"
        if os.path.exists(mp4_path):
            return mp4_path
        return filename

def render_vertical_meme_frame(content_frame_bgr, title="BIHARI AURA DAY BY DAY 💀🔥", subtitle="Never Underestimate!", tag="VIRAL REEL", target_w=1080, target_h=1920):
    canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    for y in range(target_h):
        r = int(12 + (y / target_h) * 16)
        g = int(10 + (y / target_h) * 12)
        b = int(24 + (y / target_h) * 20)
        canvas[y, :] = (b, g, r)
        
    pil_canvas = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_canvas)
    
    font_tag = get_system_font(size=30, emoji=True)
    font_title = get_system_font(size=56, emoji=True)
    font_sub = get_system_font(size=40, emoji=True)

    # --- TOP HEADER ---
    draw.rounded_rectangle([45, 50, 280, 105], radius=15, fill=(230, 20, 50))
    draw.text((65, 60), f"● {tag}", fill=(255, 255, 255), font=font_tag, embedded_color=True)
    
    bbox_title = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox_title[2] - bbox_title[0]
    th = bbox_title[3] - bbox_title[1]
    
    box_y1 = 130
    box_y2 = box_y1 + th + 40
    draw.rounded_rectangle([35, box_y1, target_w - 35, box_y2], radius=18, fill=(255, 215, 0), outline=(255, 255, 255), width=3)
    draw.text(((target_w - tw) // 2, box_y1 + 18), title, fill=(15, 15, 15), font=font_title, embedded_color=True)
    
    # --- MIDDLE VIDEO PLACEMENT ---
    video_top = box_y2 + 35
    video_bottom = target_h - 250
    available_h = video_bottom - video_top
    available_w = target_w - 60
    
    fh, fw = content_frame_bgr.shape[:2]
    scale = min(available_w / fw, available_h / fh)
    new_w = int(fw * scale)
    new_h = int(fh * scale)
    
    resized_video = cv2.resize(content_frame_bgr, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    x_offset = (target_w - new_w) // 2
    y_offset = video_top + (available_h - new_h) // 2
    
    pil_frame = Image.fromarray(cv2.cvtColor(resized_video, cv2.COLOR_BGR2RGB))
    draw.rounded_rectangle([x_offset - 6, y_offset - 6, x_offset + new_w + 6, y_offset + new_h + 6], radius=20, fill=(40, 40, 60), outline=(255, 215, 0), width=4)
    pil_canvas.paste(pil_frame, (x_offset, y_offset))
    
    draw = ImageDraw.Draw(pil_canvas)
    
    # --- BOTTOM FOOTER ---
    bbox_sub = draw.textbbox((0, 0), subtitle, font=font_sub)
    sw = bbox_sub[2] - bbox_sub[0]
    draw.rounded_rectangle([50, target_h - 200, target_w - 50, target_h - 85], radius=20, fill=(20, 20, 35, 240), outline=(0, 220, 255), width=3)
    draw.text(((target_w - sw) // 2, target_h - 160), subtitle, fill=(255, 255, 255), font=font_sub, embedded_color=True)
    
    draw.text((target_w // 2 - 130, target_h - 55), "🔥 #ViralReel #AIAnimation", fill=(160, 160, 180), font=font_tag, embedded_color=True)
    
    return cv2.cvtColor(np.array(pil_canvas), cv2.COLOR_RGB2BGR)

def generate_animated_meme_reel(
    input_video_path,
    output_path=None,
    title="BIHARI AURA DAY BY DAY 💀🔥",
    subtitle="Wait For The Real Ending! 😂💸",
    style="hayao", # "hayao", "face_paint", "hf_animegan", "comic_cel"
    mode="prequel_reveal", # "prequel_reveal", "full_anime", "split_screen"
    anime_duration=5.0,
    progress_callback=None
):
    if not output_path:
        filename = f"anime_meme_{int(time.time())}.mp4"
        output_path = os.path.join(OUTPUT_DIR, filename)
    else:
        filename = os.path.basename(output_path)
        
    temp_dir = os.path.join(MODELS_DIR, f"temp_{int(time.time())}")
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        cap = cv2.VideoCapture(input_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps
        
        print(f"[Animator] Processing video: {orig_w}x{orig_h}, {fps} FPS, {duration:.2f}s, Style: {style}, Mode: {mode}")
        if progress_callback:
            progress_callback(10, "Extracting audio and video keyframes...")
            
        audio_extracted = os.path.join(temp_dir, "orig_audio.aac")
        cmd_audio = [FFMPEG_BIN, "-y", "-i", input_video_path, "-vn", "-acodec", "copy", audio_extracted]
        subprocess.run(cmd_audio, stderr=subprocess.DEVNULL)
        has_audio = os.path.exists(audio_extracted) and os.path.getsize(audio_extracted) > 1000

        model_file = "generator_hayao.onnx" if style == "hayao" else "face_paint_512_v2_0.onnx"
        
        sample_indices = [
            int(total_frames * 0.15),
            int(total_frames * 0.45),
            int(total_frames * 0.75)
        ]
        
        anime_keyframes = []
        for idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                if style == "comic_cel":
                    stylized = stylize_frame_opencv(frame)
                elif style == "hf_animegan":
                    stylized = stylize_frame_hf(frame)
                else:
                    stylized = stylize_frame_animegan(frame, model_file)
                anime_keyframes.append(stylized)
                
        if not anime_keyframes:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            anime_keyframes.append(stylize_frame_opencv(frame))
            
        if progress_callback:
            progress_callback(35, "Rendering animated comic prequel...")
            
        target_w, target_h = 1080, 1920
        raw_video_path = os.path.join(temp_dir, "raw_composed.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(raw_video_path, fourcc, 30.0, (target_w, target_h))
        
        if mode == "prequel_reveal":
            intro_total_frames = int(anime_duration * 30)
            frames_per_shot = intro_total_frames // len(anime_keyframes)
            
            badges = ["STORY PREQUEL 📖", "WAIT FOR IT... 💀", "REAL MOMENT NEXT 💥"]
            
            for shot_idx, keyframe in enumerate(anime_keyframes):
                badge_text = badges[shot_idx % len(badges)]
                kh, kw = keyframe.shape[:2]
                
                for f_idx in range(frames_per_shot):
                    progress = f_idx / max(1, frames_per_shot - 1)
                    zoom = 1.0 + 0.12 * progress
                    
                    crop_w = int(kw / zoom)
                    crop_h = int(kh / zoom)
                    x1 = (kw - crop_w) // 2
                    y1 = (kh - crop_h) // 2
                    cropped = keyframe[y1:y1+crop_h, x1:x1+crop_w]
                    zoomed = cv2.resize(cropped, (kw, kh), interpolation=cv2.INTER_LINEAR)
                    
                    speed_line_frame = draw_manga_speed_lines(zoomed.copy(), intensity=0.28, seed=f_idx)
                    badged_frame = draw_comic_badge(speed_line_frame, text=badge_text, pos="top_left")
                    
                    meme_frame = render_vertical_meme_frame(
                        badged_frame,
                        title=title,
                        subtitle="Wait For The Ending! 😂🔥",
                        tag="ANIMATED PREQUEL",
                        target_w=target_w,
                        target_h=target_h
                    )
                    out_writer.write(meme_frame)
                    
            for flash_i in range(6):
                alpha = 1.0 - (flash_i / 6.0)
                white_frame = np.full((target_h, target_w, 3), 255, dtype=np.uint8)
                flash_frame = render_vertical_meme_frame(
                    anime_keyframes[-1],
                    title="⚡ REAL FOOTAGE REVEAL ⚡",
                    subtitle="Watch Closely! 😱",
                    tag="REAL CLIMAX",
                    target_w=target_w,
                    target_h=target_h
                )
                blended = cv2.addWeighted(white_frame, alpha, flash_frame, 1.0 - alpha, 0)
                out_writer.write(blended)
                
            if progress_callback:
                progress_callback(65, "Composing original reel climax...")
                
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            while True:
                ret, real_frame = cap.read()
                if not ret:
                    break
                real_meme_frame = render_vertical_meme_frame(
                    real_frame,
                    title=title,
                    subtitle=subtitle,
                    tag="REAL REEL",
                    target_w=target_w,
                    target_h=target_h
                )
                out_writer.write(real_meme_frame)
                
        elif mode == "full_anime":
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            f_i = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                f_i += 1
                stylized = stylize_frame_opencv(frame)
                meme_frame = render_vertical_meme_frame(
                    stylized,
                    title=title,
                    subtitle=subtitle,
                    tag="FULL ANIME REEL",
                    target_w=target_w,
                    target_h=target_h
                )
                out_writer.write(meme_frame)
                
        out_writer.release()
        cap.release()
        
        if progress_callback:
            progress_callback(85, "Mastering audio & beat drop transition...")
            
        cinematic_boom = create_cinematic_boom()
        final_mp4 = output_path
        
        if has_audio and mode == "prequel_reveal":
            delay_ms = int(anime_duration * 1000)
            filter_complex = f"[1:a]adelay={delay_ms}|{delay_ms}[orig_delayed];[2:a]volume=1.5[boom];[orig_delayed][boom]amix=inputs=2:duration=longest[aout]"
            cmd_mix = [
                FFMPEG_BIN, "-y",
                "-i", raw_video_path,
                "-i", audio_extracted,
                "-i", cinematic_boom,
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "192k",
                final_mp4
            ]
            res = subprocess.run(cmd_mix, capture_output=True, text=True)
            if res.returncode != 0:
                subprocess.run([FFMPEG_BIN, "-y", "-i", raw_video_path, "-i", audio_extracted, "-c:v", "copy", "-c:a", "aac", final_mp4], stderr=subprocess.DEVNULL)
        else:
            subprocess.run([FFMPEG_BIN, "-y", "-i", raw_video_path, "-i", cinematic_boom, "-c:v", "libx264", "-c:a", "aac", "-shortest", final_mp4], stderr=subprocess.DEVNULL)
            
        if progress_callback:
            progress_callback(100, "Done! Video rendered successfully.")
            
        print(f"[Animator] Finished! Output saved to: {final_mp4}")
        return final_mp4
        
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

def start_async_animation_job(job_id, payload):
    def _worker():
        try:
            ANIMATOR_JOBS[job_id] = {
                "status": "processing",
                "progress": 5,
                "step": "Starting reel animation...",
                "error": None,
                "filename": None,
                "videoUrl": None
            }
            
            def _cb(pct, msg):
                ANIMATOR_JOBS[job_id]["progress"] = pct
                ANIMATOR_JOBS[job_id]["step"] = msg
                
            url = payload.get("url", "").strip()
            video_name = payload.get("video_name", "").strip()
            title = payload.get("title", "VIRAL AURA REEL 💀🔥").strip()
            subtitle = payload.get("subtitle", "Wait For The Real Ending! 😂💸").strip()
            style = payload.get("style", "hayao")
            mode = payload.get("mode", "prequel_reveal")
            anime_duration = float(payload.get("anime_duration", 5.0))
            
            input_path = None
            if url:
                _cb(12, f"Downloading video from URL...")
                input_path = download_reel(url)
            elif video_name:
                cand = os.path.join(OUTPUT_DIR, video_name)
                cand2 = os.path.join(MODELS_DIR, video_name)
                cand3 = os.path.join(BASE_DIR, video_name)
                for c in [cand, cand2, cand3]:
                    if os.path.exists(c):
                        input_path = c
                        break
            elif "video_base64" in payload:
                _cb(15, "Decoding uploaded video...")
                import base64
                data = payload["video_base64"]
                if "," in data:
                    data = data.split(",", 1)[1]
                input_path = os.path.join(OUTPUT_DIR, f"upload_{job_id}.mp4")
                with open(input_path, "wb") as f:
                    f.write(base64.b64decode(data))
                    
            if not input_path or not os.path.exists(input_path):
                raise ValueError("Could not find or download input video file.")
                
            out_filename = f"anime_reel_{job_id}.mp4"
            out_filepath = os.path.join(OUTPUT_DIR, out_filename)
            
            generate_animated_meme_reel(
                input_video_path=input_path,
                output_path=out_filepath,
                title=title,
                subtitle=subtitle,
                style=style,
                mode=mode,
                anime_duration=anime_duration,
                progress_callback=_cb
            )
            
            ANIMATOR_JOBS[job_id] = {
                "status": "completed",
                "progress": 100,
                "step": "Complete!",
                "filename": out_filename,
                "videoUrl": f"/api/serve-video?name={out_filename}",
                "error": None
            }
        except Exception as e:
            print(f"[Async Job {job_id} Error] {e}")
            ANIMATOR_JOBS[job_id] = {
                "status": "failed",
                "progress": 0,
                "step": "Failed",
                "error": str(e)
            }
            
    th = threading.Thread(target=_worker, daemon=True)
    th.start()
