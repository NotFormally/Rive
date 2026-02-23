import json
import glob

for path in sorted(glob.glob('messages/*.json')):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    lp = data.get('LandingPage', {})
    
    # Fix 1: remove stray colons from philosophy_intro
    if lp.get('philosophy_intro'):
        intro = lp['philosophy_intro']
        intro = intro.replace(' : ', ' ').replace(': ', ' ').replace(' :', '')
        lp['philosophy_intro'] = intro
    
    # Fix 2: add translatable philosophy_approach key
    lp['philosophy_approach'] = 'Notre approche'
    data['LandingPage'] = lp
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    intro_preview = lp.get('philosophy_intro', '')[:70]
    print(f"Fixed {path}: {intro_preview}")
