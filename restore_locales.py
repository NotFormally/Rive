import json
import subprocess
import os

# The commit BEFORE the update_locales_v2.js was run
GOOD_COMMIT = "878f5e0~1"  # The commit before the landing page redesign

messages_dir = "messages"
files = sorted([f for f in os.listdir(messages_dir) if f.endswith('.json')])

# The NEW keys that our script was supposed to add (and ONLY these)
NEW_KEYS = [
    "features_title",
    "f1_title", "f1_desc", "f1_ex1", "f1_ex2", "f1_ex3",
    "f2_title", "f2_desc", "f2_ex1", "f2_ex2", "f2_ex3",
    "f3_title", "f3_desc", "f3_ex1", "f3_ex2", "f3_ex3",
    "f4_title", "f4_desc", "f4_ex1", "f4_ex2", "f4_ex3",
    "f5_title", "f5_desc", "f5_ex1", "f5_ex2", "f5_ex3",
    "f6_title", "f6_desc", "f6_ex1", "f6_ex2", "f6_ex3",
    "philosophy_approach",
]

# Keys that the script ALSO overwrote but shouldn't have
OVERWRITTEN_KEYS = [
    "hero_title", "hero_subtitle", "hero_description", "hero_cta",
]

for fname in files:
    fpath = os.path.join(messages_dir, fname)
    
    # 1. Get the ORIGINAL file from git (before our destructive script)
    try:
        original_bytes = subprocess.check_output(
            ["git", "show", f"d44060a:{messages_dir}/{fname}"],
            stderr=subprocess.DEVNULL
        )
        original_data = json.loads(original_bytes.decode('utf-8'))
    except Exception as e:
        print(f"SKIP {fname}: {e}")
        continue
    
    # 2. Read the CURRENT file (has the new keys but with French everywhere)
    with open(fpath, 'r', encoding='utf-8') as f:
        current_data = json.load(f)
    
    # 3. Start from the ORIGINAL data (all correct translations)
    result = original_data.copy()
    
    # 4. For LandingPage section: restore original, then add only NEW keys from current
    original_lp = original_data.get('LandingPage', {})
    current_lp = current_data.get('LandingPage', {})
    
    restored_lp = dict(original_lp)  # Start with all original translations
    
    # Add only the genuinely new keys (features_title, f1_*, f2_*, etc.)
    for key in NEW_KEYS:
        if key in current_lp:
            restored_lp[key] = current_lp[key]
    
    # For the overwritten hero keys: restore the ORIGINAL values
    for key in OVERWRITTEN_KEYS:
        if key in original_lp:
            restored_lp[key] = original_lp[key]
    
    # Also apply the philosophy_intro colon fix
    if 'philosophy_intro' in restored_lp:
        intro = restored_lp['philosophy_intro']
        intro = intro.replace(' : ', ' ').replace(': ', ' ').replace(' :', '')
        # Also fix Chinese colons
        intro = intro.replace('的是：', '的是').replace('嘅係：', '嘅係')
        restored_lp['philosophy_intro'] = intro
    
    result['LandingPage'] = restored_lp
    
    # 5. Preserve any other top-level sections that were added (Pricing, etc.)
    for section_key in current_data:
        if section_key not in result:
            result[section_key] = current_data[section_key]
    
    # 6. Write back
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    hero = restored_lp.get('hero_title', '???')[:50]
    print(f"Restored {fname}: hero_title = {hero}")
