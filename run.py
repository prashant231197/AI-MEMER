"""
AI MEMER - Application Runner
Starts the local server and opens the application in your default browser.
"""

import os
import sys
import threading
import time
import webbrowser

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add current dir and src to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(CURRENT_DIR, "src")
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

import server

def open_browser(url):
    time.sleep(1.2)
    try:
        print(f"🌐 Opening {url} in your default browser...")
        webbrowser.open(url)
    except Exception:
        pass


if __name__ == "__main__":
    url = f"http://localhost:{server.PORT}"
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()
    print("=" * 60)
    print("⚡ AI MEMER - Today's Live News & Meme Studio ⚡")
    print("=" * 60)
    print(f"👉 Local URL: {url}")
    print("👉 Press Ctrl+C anytime to stop.")
    print("=" * 60)
    server.run_server(server.PORT)
