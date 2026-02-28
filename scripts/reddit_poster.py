import json
import praw
import time
import os
from datetime import datetime

# ==========================================
# RIVE - 10-DAY AUTOMATED REDDIT CAMPAIGN
# ==========================================

# NOTE: You MUST create a Reddit App at https://www.reddit.com/prefs/apps 
# (Select "script", use http://localhost:8080 as redirect uri)
# Then fill in your credentials below or in a .env file.

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "YOUR_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME", "Qastalia")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD", "YOUR_PASSWORD")

STATE_FILE = "campaign_state.json"

CAMPAIGN = [
    {
        "day": 1,
        "subreddit": "Restaurant_Managers",
        "title": "Getting the AM and PM shifts to actually communicate.",
        "body": "The biggest headache as a GM was the complete lack of communication between shifts. Half the time, a fridge was running warm or prep was missed, and night shift only found out during the rush. We ditched WhatsApp and built a digital logbook for our spot that actually makes handover notes actionable.\n\nWe couldn't find a simple tool for this, so we built it ourselves (Rive). If anyone’s struggling with shift communication right now, I'm happy to share the link. How do you guys enforce handover notes?"
    },
    {
        "day": 2,
        "subreddit": "restaurateur",
        "title": "We cut 20% of our menu items and profits went up.",
        "body": "We didn't want to raise prices again to fight inflation. Instead, we pulled POS data and mapped every dish by popularity vs true margin. We ruthlessly cut items that had unique prep but didn't make money. Spoilage dropped, and the kitchen runs way faster.\n\nThe hardest part was mapping raw POS exports with fluctuating invoice prices, so my team built an app to automate the matrix. If anyone is trying to restructure their menu and wants to see the tool we built, let me know."
    },
    {
        "day": 3,
        "subreddit": "KitchenConfidential",
        "title": "Breaking the language barrier on the line.",
        "body": "One of the biggest issues we had with mistakes on prep lists was the language barrier (English managers, Spanish cooks, etc). We started automatically translating our recipe cards and daily prep lists. Execution improved overnight because everyone finally understood the exact instructions.\n\nWe built a simple app to do this for our kitchen (translates instant service notes natively). If anyone is managing a multilingual kitchen and wants to see it, I'll drop the link. How do you guys currently handle miscommunications?"
    },
    {
        "day": 4,
        "subreddit": "restaurant",
        "title": "Dealing with 'invisible inflation' from suppliers.",
        "body": "We couldn't figure out why our food cost was drifting up when our menu mix was the exact same. Turns out suppliers were bumping prices on high-volume items (oil, proteins) by mere pennies every few deliveries.\n\We started tracking ingredient variance week-over-week. To save time, we built a small app for our spot that reads invoices and flags supplier price jumps instantly. We're sharing it now to see if it helps others fighting the exact same battle. Let me know if you want the link."
    },
    {
        "day": 5,
        "subreddit": "smallbusiness",
        "title": "The hardest part of scaling brick & mortar was losing my 'gut feeling'.",
        "body": "When we had one location, I knew the food cost and inventory in my sleep. Opening location #2, I lost that feeling almost overnight. You can't delegate intuition to managers.\n\nWe had to build rigid but intuitive digital systems for logbooks and temp compliance. We couldn't find a tool that did this without being overly corporate, so we built one for ourselves. It acts like a compass for operations. If anyone is trying to scale physical locations right now, let me know and I'll share what we built."
    },
    {
        "day": 6,
        "subreddit": "CoffeeShop",
        "title": "Tracking true pastry/milk waste instead of just guessing.",
        "body": "We were heavily bleeding margin on dairy and pastry waste, but our paper costs looked fine. Baristas were just tossing things at the end of the shift without logging them accurately.\n\nWe stopped using messy clipboards and moved to a streamlined digital waste tracker that syncs with our POS, so variance is calculated down to the ounce. We built it initially just for our own cafe. If any owners are trying to get a better grip on their true COGS, let me know and I'll send the link."
    },
    {
        "day": 7,
        "subreddit": "chefit",
        "title": "Getting morning crew to actually standardize the prep list.",
        "body": "Every morning was chaos because the prep list was either illegible or missing key pars based on yesterday's sales. We finally digitized the whole process.\n\nNow the system looks at what sold yesterday and auto-generates the prep requirements, and we can translate it into Spanish/French instantly for the crew. We built this tool for our own kitchen to stop the madness. If any chefs want to see the workflow we use, happy to share."
    },
    {
        "day": 8,
        "subreddit": "Entrepreneur",
        "title": "Why is operating software for brick-and-mortar so far behind e-commerce?",
        "body": "I run a hospitality business, and I'm amazed at how much better the software is for my friends in e-commerce. They get precise analytics, while I'm stuck cross-referencing CSVs from Toast with paper invoices just to find my true margins.\n\nWe got so fed up that we built our own operational OS to act as a compass for POS sync, digital logbooks, and live variance tracking. If anyone here is operating physical retail/hospitality and wants to see what we built, I'll share the link."
    },
    {
        "day": 9,
        "subreddit": "hospitality",
        "title": "Fighting fluctuating supplier costs without raising prices.",
        "body": "It feels like every week a different supplier is bumping prices by 2%. Instead of passing that directly to the customer, we started aggressively mapping our menu to find the 'Anchor' items (popular but low margin) and re-engineered them using cross-utilized ingredients.\n\nIt saved our margins. We actually built an AI tool to automate this POS/Cost matrix for us. If any other operators are trying to survive without printing new menus, let me know and I'll send the link."
    },
    {
        "day": 10,
        "subreddit": "POS",
        "title": "Extracting actual actionable data from Toast/Square.",
        "body": "POS systems are great for taking money, but terrible for telling me my actual food cost variance against fluctuating invoices. We spent months fighting with Excel exports before we finally built a custom integration for our spot.\n\nIt reads the live POS mix, compares it against digital invoices, and flags exactly where we are bleeding margin. We formalized it into a small app. If anyone is trying to get better data out of their POS, let me know and I'll share it."
    }
]

def load_state():
    if not os.path.exists(STATE_FILE):
        return {"current_day_index": 0, "last_posted_date": None}
    with open(STATE_FILE, "r") as f:
        return json.load(f)

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def post_to_reddit():
    state = load_state()
    today_str = datetime.now().strftime("%Y-%m-%d")

    if state["last_posted_date"] == today_str:
        print(f"[{datetime.now()}] A post was already made today. Skipping.")
        return

    index = state["current_day_index"]
    if index >= len(CAMPAIGN):
        print("Campaign is complete! All 10 posts have been deployed.")
        return

    post_data = CAMPAIGN[index]
    
    print(f"[{datetime.now()}] Preparing to post Day {post_data['day']} to r/{post_data['subreddit']}...")
    
    try:
        reddit = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            username=REDDIT_USERNAME,
            password=REDDIT_PASSWORD,
            user_agent="mac:rivehub.marketing:v1.0 (by /u/Qastalia)"
        )
        
        # NOTE: If evaluating credentials, uncomment the line below.
        # print("Authenticated as:", reddit.user.me())

        subreddit = reddit.subreddit(post_data["subreddit"])
        submission = subreddit.submit(title=post_data["title"], selftext=post_data["body"])
        
        print(f"SUCCESS: Post is live at: {submission.url}")
        
        # Update State
        state["current_day_index"] += 1
        state["last_posted_date"] = today_str
        save_state(state)
        
    except Exception as e:
        print(f"FAILED to post: {e}")

if __name__ == "__main__":
    import configparser
    # Just a simple run. For full automation, schedule this via cron:
    # 0 10 * * * cd /Users/nassim/Shore/scripts && python3 reddit_poster.py >> campaign.log 2>&1
    post_to_reddit()
