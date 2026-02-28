#!/usr/bin/env python3
"""
Rive Reddit Lead Scraper
This script searches targeted subreddits for keywords indicating high buying intent
for restaurant management / food cost solutions.

Requirements:
    pip install praw python-dotenv

Usage:
    Create a .env file with REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
    python scripts/reddit_scraper.py
"""

import os
import json
from datetime import datetime
import praw

# Configuration
SUBREDDITS = ['restaurantowners', 'restaurateur', 'Restaurant_Managers', 'BarOwners']
KEYWORDS = ['food cost', 'margins', 'inflation', 'struggling', 'inventory software', 'cost of goods', 'profitability']

def init_reddit():
    """Initialize PRAW with environment variables."""
    client_id = os.environ.get('REDDIT_CLIENT_ID')
    client_secret = os.environ.get('REDDIT_CLIENT_SECRET')
    user_agent = os.environ.get('REDDIT_USER_AGENT', 'RiveLeadScraper/1.0')

    if not client_id or not client_secret:
        print("Warning: Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET in environment variables.")
        print("Scraper will run in read-only mode if possible, or will fail if API requires auth.")
        # Some endpoints might work anonymously, but usually PRAW needs an app
        return praw.Reddit(client_id='dummy', client_secret='dummy', user_agent=user_agent)

    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent
    )

def scrape_leads(reddit, limit=20):
    """Scrape recent posts from target subreddits using keywords."""
    leads = []
    
    print(f"Scraping subreddits: {', '.join(SUBREDDITS)}")
    print(f"Keywords: {', '.join(KEYWORDS)}")
    
    subreddits_str = '+'.join(SUBREDDITS)
    subreddit = reddit.subreddit(subreddits_str)

    # Search for each keyword
    for keyword in KEYWORDS:
        print(f"Searching for: '{keyword}'...")
        try:
            # We search the past week
            for submission in subreddit.search(keyword, sort='new', time_filter='week', limit=limit):
                
                # Check if we already added this post from another keyword
                if any(lead['id'] == submission.id for lead in leads):
                    continue
                
                # Calculate a rough "buying intent" score based on text length and upvotes
                # (People writing long posts about struggles are usually more desperate for solutions)
                intent_score = min(10, max(1, len(submission.selftext) // 200 + submission.score // 10))
                
                lead = {
                    'id': submission.id,
                    'title': submission.title,
                    'author': submission.author.name if submission.author else '[deleted]',
                    'subreddit': submission.subreddit.display_name,
                    'url': f"https://www.reddit.com{submission.permalink}",
                    'created_utc': datetime.fromtimestamp(submission.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                    'intent_score': intent_score,
                    'matched_keyword': keyword,
                    # Truncate text for the report
                    'snippet': submission.selftext[:200] + "..." if len(submission.selftext) > 200 else submission.selftext 
                }
                leads.append(lead)
        except Exception as e:
            print(f"Error searching for '{keyword}': {e}")
            break

    # Sort leads by intent score descending
    leads.sort(key=lambda x: x['intent_score'], reverse=True)
    return leads

def main():
    reddit = init_reddit()
    print("Initializing Reddit Scraper for Rive...")
    
    leads = scrape_leads(reddit)
    
    if not leads:
        print("No leads found this time.")
        return

    print(f"\nFound {len(leads)} potential leads.")
    
    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"reddit_leads_{timestamp}.json"
    
    # Save in the same directory as the script or project root
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(leads, f, indent=4, ensure_ascii=False)
        
    print(f"Saved results to: {filepath}")
    
    # Print top 3 leads
    print("\n--- TOP 3 LEADS ---")
    for lead in leads[:3]:
        print(f"Score: {lead['intent_score']}/10 | r/{lead['subreddit']}")
        print(f"Title: {lead['title']}")
        print(f"URL: {lead['url']}")
        print(f"Snippet: {lead['snippet']}")
        print("-" * 30)

if __name__ == "__main__":
    main()
