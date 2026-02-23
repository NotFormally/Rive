const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'messages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (data.LandingPage) {
    // Fix 1: remove colon from philosophy_intro (handles ": " and " :")
    if (data.LandingPage.philosophy_intro) {
      data.LandingPage.philosophy_intro = data.LandingPage.philosophy_intro
        .replace(' : ', ' ')
        .replace(': ', ' ')
        .replace(' :', '');
    }
    // Fix 2: add translatable philosophy_approach key
    data.LandingPage.philosophy_approach = 'Notre approche';
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated ' + file + ' — intro: ' + data.LandingPage?.philosophy_intro?.slice(0, 60));
}
