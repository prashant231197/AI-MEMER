"""
AI MEMER - Interactive CLI & Application Entry Point
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(CURRENT_DIR, "src")
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from pygnews import fetcher, constants
import server

def print_banner():
    print("""
============================================================
       ⚡ AI MEMER: TODAY'S LIVE NEWS & MEME STUDIO ⚡
============================================================
""")

def run_cli_top_stories():
    print("\n📡 Fetching top stories from Google News...")
    gnews = fetcher.PyGNews()
    stories = gnews.top_stories()
    print(f"\n✅ Retrieved {len(stories)} story clusters:\n")
    
    count = 0
    for idx, cluster in stories.items():
        if not cluster:
            continue
        lead = cluster[0]
        count += 1
        print(f"[{count}] 📰 {lead.get('title')}")
        print(f"    🏢 Source: {lead.get('publisher')} | 🕒 {lead.get('published_date')}")
        print(f"    🔗 URL: {lead.get('url')[:80]}...\n")
        if count >= 8:
            break

def run_cli_topic():
    print("\nAvailable Topics:")
    for i, t in enumerate(constants.TOPICS, 1):
        print(f"  {i}. {t}")
    choice = input("\nEnter topic name or number [default: TECHNOLOGY]: ").strip().upper()
    if not choice:
        topic = "TECHNOLOGY"
    elif choice.isdigit() and 1 <= int(choice) <= len(constants.TOPICS):
        topic = constants.TOPICS[int(choice) - 1]
    else:
        topic = choice

    print(f"\n📡 Fetching headlines for topic: {topic}...")
    try:
        gnews = fetcher.PyGNews()
        headlines = gnews.topic_headlines(topic=topic)
        count = 0
        for idx, cluster in headlines.items():
            if not cluster:
                continue
            lead = cluster[0]
            count += 1
            print(f"[{count}] 📰 {lead.get('title')}")
            print(f"    🏢 {lead.get('publisher')}\n")
            if count >= 8:
                break
    except Exception as e:
        print(f"❌ Error: {e}")

def run_cli_search():
    q = input("\nEnter search query (e.g. AI, Space, Tech): ").strip()
    if not q:
        print("Query cannot be empty.")
        return
    print(f"\n📡 Searching for '{q}'...")
    try:
        gnews = fetcher.PyGNews()
        results = gnews.search(search_query=q)
        count = 0
        for idx, cluster in results.items():
            if not cluster:
                continue
            lead = cluster[0]
            count += 1
            print(f"[{count}] 📰 {lead.get('title')}")
            print(f"    🏢 {lead.get('publisher')}\n")
            if count >= 8:
                break
    except Exception as e:
        print(f"❌ Error: {e}")

def run_cli_meme_generator():
    print("\n🤖 AI Meme Idea Generator")
    gnews = fetcher.PyGNews()
    stories = gnews.top_stories()
    valid = []
    for cluster in stories.values():
        if cluster and cluster[0].get('title'):
            valid.append(cluster[0])
    
    if not valid:
        print("No headlines found.")
        return

    sample = valid[:3]
    for item in sample:
        meme = server.generate_meme_angles(item['title'], item.get('publisher', ''))
        print("\n" + "-" * 55)
        print(f"📰 HEADLINE: {meme['headline']}")
        print(f"🏢 SOURCE:   {meme['publisher']}")
        print("💡 MEME ANGLES:")
        for angle in meme['angles'][:3]:
            print(f"  • [{angle['vibe']}] ({angle['template']})")
            print(f"    Top:      {angle['top_text']}")
            print(f"    Bottom:   {angle['bottom_text']}")
            print(f"    Punchline:{angle['punchline']}")
    print("-" * 55)

def main():
    print_banner()
    if len(sys.argv) > 1 and sys.argv[1] == "--web":
        import run
        return

    while True:
        print("\nSelect an option:")
        print("  1. 🌐 Launch Web Application & Meme Studio (Recommended)")
        print("  2. 🔥 View Top News Stories (CLI)")
        print("  3. 📑 Browse by Topic (Tech, Business, etc.)")
        print("  4. 🔍 Search News Headlines")
        print("  5. 🤖 Generate AI Meme Ideas for Today's News")
        print("  6. 🚪 Exit")

        choice = input("\nEnter choice [1-6, default: 1]: ").strip()
        if choice in ("", "1"):
            import run
            break
        elif choice == "2":
            run_cli_top_stories()
        elif choice == "3":
            run_cli_topic()
        elif choice == "4":
            run_cli_search()
        elif choice == "5":
            run_cli_meme_generator()
        elif choice == "6":
            print("Goodbye!")
            break
        else:
            print("Invalid choice, please select 1-6.")

if __name__ == "__main__":
    main()
