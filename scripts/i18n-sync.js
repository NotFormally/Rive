#!/usr/bin/env node

/**
 * i18n-sync — Automated Translation Agent
 * 
 * Watches en.json and fr.json for changes, detects modified keys,
 * and translates them to all 23 other supported languages using Gemini.
 * 
 * Usage:
 *   npm run i18n:watch   → live watcher (alongside dev server)
 *   npm run i18n:sync    → one-shot sync (CI / pre-commit)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Config ───────────────────────────────────────────────────────────────────

const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const CACHE_DIR = path.join(MESSAGES_DIR, '.i18n-cache');
const SOURCE_FILES = ['en.json', 'fr.json'];
const CONCURRENCY = 5;
const DEBOUNCE_MS = 2000;
const MODEL = 'gemini-2.0-flash';

const LANG_MAP = {
  // Major
  'da.json': 'Danish',
  'sv.json': 'Swedish',
  'es.json': 'Spanish',
  'it.json': 'Italian',
  'de.json': 'German',
  'pt.json': 'Portuguese (Brazilian)',
  'ru.json': 'Russian',
  'pl.json': 'Polish',
  'tr.json': 'Turkish',
  // MENA
  'ar.json': 'Arabic (Modern Standard)',
  'ar-AE.json': 'Arabic (UAE dialect)',
  'ar-LB.json': 'Arabic (Lebanese dialect)',
  'ar-EG.json': 'Arabic (Egyptian dialect)',
  'kab.json': 'Kabyle (Taqbaylit)',
  // Asia
  'hi.json': 'Hindi',
  'ur.json': 'Urdu',
  'pa.json': 'Punjabi (Gurmukhi script)',
  'ta.json': 'Tamil',
  'bn.json': 'Bengali',
  'zh-CN.json': 'Simplified Chinese',
  'zh-HK.json': 'Traditional Chinese (Hong Kong Cantonese)',
  'nan.json': 'Min Nan Chinese (Taiwanese Hokkien)',
  'ja.json': 'Japanese',
  'ko.json': 'Korean',
  // Indo-Oceania
  'id.json': 'Indonesian',
  'ms.json': 'Malay',
  'jv.json': 'Javanese',
  'th.json': 'Thai',
  'vi.json': 'Vietnamese',
  'tl.json': 'Tagalog / Filipino',
  // Africa
  'sw.json': 'Swahili',
  'am.json': 'Amharic',
  'yo.json': 'Yoruba',
  'ha.json': 'Hausa',
  'zu.json': 'Zulu',
  'om.json': 'Oromo',
  // ANZ
  'en-AU.json': 'English (Australian)',
  'en-NZ.json': 'English (New Zealand)',
  // Celtic
  'br.json': 'Breton',
  'cy.json': 'Welsh',
  'gd.json': 'Scottish Gaelic',
  'ga.json': 'Irish (Gaeilge)',
  // Romance/Isolates
  'eu.json': 'Basque (Euskara)',
  'co.json': 'Corsican',
  // Germanic Regional
  'nl.json': 'Dutch',
  'nl-BE.json': 'Flemish (Belgian Dutch)',
  'nds.json': 'Low German (Plattdeutsch)',
  'gsw.json': 'Swiss German (Alemannic)',
  'frk-mos.json': 'Moselle Franconian (Luxembourgish-adjacent)',
  // Others/Creoles
  'hsb.json': 'Upper Sorbian',
  'rom.json': 'Romani',
  'ht.json': 'Haitian Creole',
};

// ─── Gemini Client ────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

// ─── Utility Functions ────────────────────────────────────────────────────────

function getNestedKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getNestedKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function setNestedValue(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// ─── Diff Engine ──────────────────────────────────────────────────────────────

function findChangedKeys(currentJson, cachedJson) {
  const currentKeys = getNestedKeys(currentJson);
  const changed = [];

  for (const key of currentKeys) {
    const currentVal = getNestedValue(currentJson, key);
    const cachedVal = cachedJson ? getNestedValue(cachedJson, key) : undefined;

    if (currentVal !== cachedVal) {
      changed.push(key);
    }
  }

  return changed;
}

function buildTranslationPayload(sourceJson, changedKeys) {
  const payload = {};
  for (const key of changedKeys) {
    const val = getNestedValue(sourceJson, key);
    if (val !== undefined) {
      setNestedValue(payload, key, val);
    }
  }
  return payload;
}

// ─── Gemini Translation ───────────────────────────────────────────────────────

async function translateWithGemini(payload, sourceLang, targetLangName) {
  const prompt = `You are a professional translator for a restaurant management SaaS called RiveHub that uses a nautical/maritime theme.

Translate the following JSON values from ${sourceLang} to ${targetLangName}.

Rules:
- Maintain the EXACT JSON structure and keys (do not translate keys)
- Keep brand names (RiveHub, HACCP, POS, Toast, Square, etc.) untranslated
- Preserve HTML entities, special characters, emojis, and formatting
- Keep nautical metaphors culturally appropriate in the target language
- Return ONLY the raw JSON object — no markdown, no code blocks, no explanations
- First character must be { and last character must be }

JSON to translate:
${JSON.stringify(payload, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Clean potential markdown wrapping
  const cleaned = text
    .replace(/^\s*```json\s*/im, '')
    .replace(/^\s*```\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  return JSON.parse(cleaned);
}

// ─── Core Sync Logic ──────────────────────────────────────────────────────────

const CHUNK_SIZE = 50; // Max keys per Gemini API call

async function syncLanguage(targetFile, changedKeys, sourceJson, sourceLang) {
  const langName = LANG_MAP[targetFile];
  if (!langName) return;

  const targetPath = path.join(MESSAGES_DIR, targetFile);
  const targetJson = loadJSON(targetPath);
  if (!targetJson) {
    console.error(`  ✗ Could not parse ${targetFile}`);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Chunk the changed keys into batches
  for (let i = 0; i < changedKeys.length; i += CHUNK_SIZE) {
    const chunkKeys = changedKeys.slice(i, i + CHUNK_SIZE);
    const chunkPayload = buildTranslationPayload(sourceJson, chunkKeys);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(changedKeys.length / CHUNK_SIZE);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const translated = await translateWithGemini(chunkPayload, sourceLang, langName);

        // Deep merge translated keys into target
        const allKeys = getNestedKeys(translated);
        for (const key of allKeys) {
          const val = getNestedValue(translated, key);
          if (val !== undefined && typeof val === 'string') {
            setNestedValue(targetJson, key, val);
          }
        }

        successCount += chunkKeys.length;
        break; // Success — exit retry loop
      } catch (err) {
        if (attempt === 2) {
          console.error(`  ⚠ ${targetFile} chunk ${chunkNum}/${totalChunks}: ${err.message}`);
          failCount += chunkKeys.length;
        }
        // Brief pause before retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Save after all chunks processed
  saveJSON(targetPath, targetJson);

  if (failCount === 0) {
    console.log(`  ✓ ${targetFile} (${langName}) — ${successCount} keys`);
  } else {
    console.log(`  ⚠ ${targetFile} (${langName}) — ${successCount} ok, ${failCount} failed`);
  }
}

async function runSync() {
  console.log('\n🔄 i18n-sync — checking for changes...\n');

  // Ensure cache dir exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  let totalChanged = 0;

  for (const sourceFile of SOURCE_FILES) {
    const sourcePath = path.join(MESSAGES_DIR, sourceFile);
    const cachePath = path.join(CACHE_DIR, sourceFile);

    const currentJson = loadJSON(sourcePath);
    const cachedJson = loadJSON(cachePath);

    if (!currentJson) {
      console.error(`Could not read ${sourceFile}`);
      continue;
    }

    const changedKeys = findChangedKeys(currentJson, cachedJson);

    if (changedKeys.length === 0) {
      console.log(`📋 ${sourceFile}: no changes detected`);
      continue;
    }

    console.log(`📝 ${sourceFile}: ${changedKeys.length} key(s) changed`);
    if (changedKeys.length <= 50) {
      changedKeys.forEach(k => console.log(`   → ${k}`));
    } else {
      changedKeys.slice(0, 10).forEach(k => console.log(`   → ${k}`));
      console.log(`   ... and ${changedKeys.length - 10} more`);
    }

    const sourceLang = sourceFile === 'en.json' ? 'English' : 'French';

    // Determine target files (exclude source files)
    const targetFiles = Object.keys(LANG_MAP).filter(f => !SOURCE_FILES.includes(f));

    // Process languages in batches (CONCURRENCY at a time)
    console.log(`\n🌐 Translating to ${targetFiles.length} languages...\n`);
    for (let i = 0; i < targetFiles.length; i += CONCURRENCY) {
      const batch = targetFiles.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(f => syncLanguage(f, changedKeys, currentJson, sourceLang)));
    }

    totalChanged += changedKeys.length;

    // Update cache
    saveJSON(cachePath, currentJson);
    console.log(`\n💾 Cache updated for ${sourceFile}`);
  }

  if (totalChanged === 0) {
    console.log('\n✅ All languages are in sync.\n');
  } else {
    console.log(`\n✅ Synced ${totalChanged} key(s) across all languages.\n`);
  }
}

// ─── Watch Mode ───────────────────────────────────────────────────────────────

function startWatcher() {
  console.log('👁️  i18n-sync — watching for changes to en.json and fr.json...');
  console.log('   Press Ctrl+C to stop.\n');

  let debounceTimer = null;
  let isRunning = false;

  const onChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        await runSync();
      } catch (err) {
        console.error('Sync error:', err.message);
      }
      isRunning = false;
    }, DEBOUNCE_MS);
  };

  for (const file of SOURCE_FILES) {
    const filePath = path.join(MESSAGES_DIR, file);
    fs.watch(filePath, { persistent: true }, (eventType) => {
      if (eventType === 'change') {
        console.log(`\n📡 Change detected in ${file}...`);
        onChange();
      }
    });
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    process.exit(1);
  }

  const isOnce = process.argv.includes('--once');

  if (isOnce) {
    // One-shot mode
    await runSync();
  } else {
    // Initial sync, then watch
    await runSync();
    startWatcher();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
