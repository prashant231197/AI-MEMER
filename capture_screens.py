import time
import os
from playwright.sync_api import sync_playwright

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "ad_assets", "screens")
os.makedirs(ASSETS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # High quality viewport 1920x1080
    context = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1.25)
    page = context.new_page()
    page.goto("http://localhost:5050", wait_until="networkidle")
    time.sleep(3)

    # 1. Main Dashboard
    page.screenshot(path=os.path.join(ASSETS_DIR, "01_dashboard.png"))
    print("1. Dashboard captured")

    # 2. Click on 'Tech' topic tab
    try:
        page.click("#tabTech")
        time.sleep(2.5)
        page.screenshot(path=os.path.join(ASSETS_DIR, "02_tech_feed.png"))
        print("2. Tech feed captured")
    except Exception as e:
        print("Error tabTech:", e)

    # 3. Select first news card to open Meme Studio
    try:
        cards = page.locator(".news-card")
        if cards.count() > 0:
            first_card = cards.first
            meme_btn = first_card.locator("button:has-text('Meme This')")
            if meme_btn.count() > 0:
                meme_btn.click()
            else:
                first_card.click()
            time.sleep(2.5)
        else:
            page.evaluate("openStudioModal()")
            time.sleep(2)
        
        page.screenshot(path=os.path.join(ASSETS_DIR, "03_meme_studio.png"))
        print("3. Meme studio captured")
        
        # Click on template tab 'Breaking News'
        try:
            page.click("button[data-template='breaking_news']")
            time.sleep(1.5)
            page.screenshot(path=os.path.join(ASSETS_DIR, "03b_breaking_template.png"))
            print("3b. Breaking template captured")
        except Exception as e:
            print("Error breaking template:", e)

        # Close studio modal
        page.evaluate("closeStudioModal()")
        time.sleep(1)
    except Exception as e:
        print("Error opening meme studio:", e)

    # 4. Open Reel Maker Studio
    try:
        page.evaluate("openReelStudio()")
        time.sleep(2.5)
        page.screenshot(path=os.path.join(ASSETS_DIR, "04_reel_studio.png"))
        print("4. Reel studio captured")

        # 5. Click on Collab Split Mode
        try:
            page.click("button[data-collab='split2']")
            time.sleep(1.5)
            page.screenshot(path=os.path.join(ASSETS_DIR, "05_collab_split.png"))
            print("5. Collab split captured")
        except Exception as e:
            print("Error collab split:", e)

        # Click on TV Chyron layout
        try:
            page.click("button[data-reellayout='reel_chyron']")
            time.sleep(1.5)
            page.screenshot(path=os.path.join(ASSETS_DIR, "05b_chyron_layout.png"))
            print("5b. Chyron layout captured")
        except Exception as e:
            print("Error chyron layout:", e)

        page.evaluate("closeReelStudio()")
        time.sleep(1)
    except Exception as e:
        print("Error reel studio:", e)

    # 6. Batch Action Bar & Instagram Connect Modal
    try:
        # Check select all news
        page.click("#selectAllNewsCheckbox")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(ASSETS_DIR, "06_batch_selected.png"))
        print("6. Batch selection captured")

        # Open Instagram modal
        page.evaluate("openInstagramModal()")
        time.sleep(2)
        page.screenshot(path=os.path.join(ASSETS_DIR, "06b_instagram_modal.png"))
        print("6b. Instagram modal captured")
    except Exception as e:
        print("Error batch/ig:", e)

    browser.close()
    print("All captures completed successfully!")

