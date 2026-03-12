#!/usr/bin/env node

/**
 * i18n-sync — Automated Translation Pipeline (Claude API)
 *
 * Single source of truth: en.json → all other locales auto-generated.
 * Uses Claude API (Haiku) for cost-efficient, high-quality translations.
 *
 * Usage:
 *   npm run i18n:watch          → live watcher (alongside dev server)
 *   npm run i18n:sync           → one-shot sync (CI / pre-commit)
 *   npm run i18n:sync:force     → nuclear resync — retranslate ALL keys
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local'), override: true });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk').default;

// ─── Config ───────────────────────────────────────────────────────────────────

const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const CACHE_DIR = path.join(MESSAGES_DIR, '.i18n-cache');
const HASH_FILE = path.join(CACHE_DIR, 'hashes.json');
const SOURCE_FILE = 'en.json';
const CONCURRENCY = 5;
const CHUNK_SIZE = 50;
const MAX_RETRIES = 3;
const DEBOUNCE_MS = 2000;
const MODEL = 'claude-haiku-4-5-20251001';

const LANG_MAP = {
  // Source language (French is now a target, auto-generated from English)
  'fr.json': 'French',
  // Major European
  'da.json': 'Danish',
  'sv.json': 'Swedish',
  'es.json': 'Spanish',
  'it.json': 'Italian',
  'de.json': 'German',
  'pt.json': 'Portuguese (Brazilian)',
  'ru.json': 'Russian',
  'pl.json': 'Polish',
  'tr.json': 'Turkish',
  'ro.json': 'Romanian',
  'el.json': 'Greek',
  'hu.json': 'Hungarian',
  'cs.json': 'Czech',
  // MENA
  'ar.json': 'Arabic (Modern Standard)',
  'ar-AE.json': 'Arabic (UAE dialect)',
  'ar-LB.json': 'Arabic (Lebanese dialect)',
  'ar-EG.json': 'Arabic (Egyptian dialect)',
  'kab.json': 'Kabyle (Taqbaylit)',
  'fa.json': 'Persian (Farsi)',
  // South Asia
  'hi.json': 'Hindi',
  'ur.json': 'Urdu',
  'pa.json': 'Punjabi (Gurmukhi script)',
  'ta.json': 'Tamil',
  'bn.json': 'Bengali',
  // East Asia
  'zh-CN.json': 'Simplified Chinese',
  'zh-HK.json': 'Traditional Chinese (Hong Kong Cantonese)',
  'nan.json': 'Min Nan Chinese (Taiwanese Hokkien)',
  'ja.json': 'Japanese',
  'ko.json': 'Korean',
  // Southeast Asia / Oceania
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
  // ANZ English Variants
  'en-AU.json': 'English (Australian)',
  'en-NZ.json': 'English (New Zealand)',
  // Celtic
  'br.json': 'Breton',
  'cy.json': 'Welsh',
  'gd.json': 'Scottish Gaelic',
  'ga.json': 'Irish (Gaeilge)',
  // Romance / Isolates
  'eu.json': 'Basque (Euskara)',
  'co.json': 'Corsican',
  // Germanic Regional
  'nl.json': 'Dutch',
  'nl-BE.json': 'Flemish (Belgian Dutch)',
  'nds.json': 'Low German (Plattdeutsch)',
  'gsw.json': 'Swiss German (Alemannic)',
  'frk-mos.json': 'Moselle Franconian (Luxembourgish-adjacent)',
  // Others / Creoles
  'hsb.json': 'Upper Sorbian',
  'rom.json': 'Romani',
  'ht.json': 'Haitian Creole',
};

// ─── Claude Client ───────────────────────────────────────────────────────────

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a professional translator for RiveHub, a restaurant management SaaS with a nautical/maritime theme.

Domain context — these terms have specific meanings in the app:
- "bridge" = kitchen command center, "crew" = staff, "passengers" = guests
- "cargo" = inventory/supplies, "sonar" = predictive analytics
- "captain" = head chef/owner, "vessel" = the restaurant itself
- "dock" = onboarding area, "logbook" = operational journal

Rules:
- Translate JSON values ONLY. Do NOT translate JSON keys.
- Keep brand names untranslated: RiveHub, HACCP, POS, Toast, Square, SumUp, Lightspeed, Zettle, Resy, Libro, Zenchef, BCG, Stripe, Claude, Whisper
- Preserve HTML entities, emojis, special characters, and template placeholders like {count}, {val}, {name}, {percent}, {tier}, {date}
- Adapt nautical metaphors to be culturally natural — don't force literal translations when they sound awkward
- For RTL languages (Arabic, Hebrew, Urdu, Farsi): maintain logical content order within each value
- Return ONLY the raw JSON object — no markdown fences, no code blocks, no explanations
- First character of your response must be { and last must be }`;

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

function hashValue(val) {
  return crypto.createHash('md5').update(String(val)).digest('hex').slice(0, 8);
}

// ─── Hash-Based Diff Engine ──────────────────────────────────────────────────

function buildHashes(json) {
  const hashes = {};
  const keys = getNestedKeys(json);
  for (const key of keys) {
    const val = getNestedValue(json, key);
    if (val !== undefined) {
      hashes[key] = hashValue(val);
    }
  }
  return hashes;
}

function findChangedKeys(currentJson, cachedHashes) {
  const currentKeys = getNestedKeys(currentJson);
  const changed = [];

  for (const key of currentKeys) {
    const currentVal = getNestedValue(currentJson, key);
    const currentHash = hashValue(currentVal);
    const cachedHash = cachedHashes ? cachedHashes[key] : undefined;

    if (currentHash !== cachedHash) {
      changed.push(key);
    }
  }

  // Log deleted keys (in cache but not in current)
  if (cachedHashes) {
    const deletedKeys = Object.keys(cachedHashes).filter(k => !getNestedValue(currentJson, k));
    if (deletedKeys.length > 0) {
      console.log(`   🗑️ ${deletedKeys.length} key(s) removed from source`);
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

// ─── Claude Translation ──────────────────────────────────────────────────────

async function translateWithClaude(payload, targetLangName) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Translate the following JSON values from English to ${targetLangName}.\n\n${JSON.stringify(payload, null, 2)}`
    }]
  });

  const text = response.content[0].text.trim();

  // Clean potential markdown wrapping
  const cleaned = text
    .replace(/^\s*```json\s*/im, '')
    .replace(/^\s*```\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  return JSON.parse(cleaned);
}

// ─── Core Sync Logic ──────────────────────────────────────────────────────────

async function syncLanguage(targetFile, changedKeys, sourceJson) {
  const langName = LANG_MAP[targetFile];
  if (!langName) return;

  const targetPath = path.join(MESSAGES_DIR, targetFile);
  let targetJson = loadJSON(targetPath);
  if (!targetJson) {
    // If target file doesn't exist or is empty, start from scratch
    targetJson = {};
  }

  let successCount = 0;
  let failCount = 0;

  // Chunk the changed keys into batches
  for (let i = 0; i < changedKeys.length; i += CHUNK_SIZE) {
    const chunkKeys = changedKeys.slice(i, i + CHUNK_SIZE);
    const chunkPayload = buildTranslationPayload(sourceJson, chunkKeys);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(changedKeys.length / CHUNK_SIZE);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const translated = await translateWithClaude(chunkPayload, langName);

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
        const backoff = attempt === 1 ? 0 : attempt === 2 ? 2000 : 5000;
        if (attempt === MAX_RETRIES) {
          console.error(`  ⚠ ${targetFile} chunk ${chunkNum}/${totalChunks}: ${err.message}`);
          failCount += chunkKeys.length;
        } else {
          await new Promise(r => setTimeout(r, backoff));
        }
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

  return { success: successCount, fail: failCount };
}

async function runSync(isForce = false) {
  console.log('\n🔄 i18n-sync — checking for changes...\n');

  // Ensure cache dir exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // --force: clear cache to trigger full retranslation
  if (isForce) {
    console.log('🔥 Force mode — clearing cache, all keys will be retranslated.\n');
    if (fs.existsSync(HASH_FILE)) {
      fs.unlinkSync(HASH_FILE);
    }
    // Also clean up legacy cache files
    for (const f of ['en.json', 'fr.json']) {
      const legacy = path.join(CACHE_DIR, f);
      if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
    }
  }

  const sourcePath = path.join(MESSAGES_DIR, SOURCE_FILE);
  const currentJson = loadJSON(sourcePath);

  if (!currentJson) {
    console.error(`Could not read ${SOURCE_FILE}`);
    process.exit(1);
  }

  const cachedHashes = loadJSON(HASH_FILE);
  const changedKeys = findChangedKeys(currentJson, cachedHashes);

  if (changedKeys.length === 0) {
    console.log(`📋 ${SOURCE_FILE}: no changes detected`);
    console.log('\n✅ All languages are in sync.\n');
    return;
  }

  console.log(`📝 ${SOURCE_FILE}: ${changedKeys.length} key(s) changed`);
  if (changedKeys.length <= 50) {
    changedKeys.forEach(k => console.log(`   → ${k}`));
  } else {
    changedKeys.slice(0, 10).forEach(k => console.log(`   → ${k}`));
    console.log(`   ... and ${changedKeys.length - 10} more`);
  }

  // Determine target files
  const targetFiles = Object.keys(LANG_MAP);

  // Process languages in batches (CONCURRENCY at a time)
  console.log(`\n🌐 Translating to ${targetFiles.length} languages...\n`);

  let totalSuccess = 0;
  let totalFail = 0;
  const startTime = Date.now();

  for (let i = 0; i < targetFiles.length; i += CONCURRENCY) {
    const batch = targetFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(f => syncLanguage(f, changedKeys, currentJson))
    );
    for (const r of results) {
      if (r) {
        totalSuccess += r.success;
        totalFail += r.fail;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Update hash cache
  const newHashes = buildHashes(currentJson);
  saveJSON(HASH_FILE, newHashes);
  console.log(`\n💾 Hash cache updated (${Object.keys(newHashes).length} keys)`);

  // Summary
  console.log(`\n✅ Synced ${changedKeys.length} key(s) across ${targetFiles.length} languages in ${elapsed}s`);
  if (totalFail > 0) {
    console.log(`⚠ ${totalFail} translation(s) failed — re-run to retry.\n`);
  } else {
    console.log('');
  }
}

// ─── Watch Mode ───────────────────────────────────────────────────────────────

function startWatcher() {
  console.log('👁️  i18n-sync — watching for changes to en.json...');
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

  const filePath = path.join(MESSAGES_DIR, SOURCE_FILE);
  fs.watch(filePath, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      console.log(`\n📡 Change detected in ${SOURCE_FILE}...`);
      onChange();
    }
  });
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    process.exit(1);
  }

  const isOnce = process.argv.includes('--once');
  const isForce = process.argv.includes('--force');

  if (isOnce) {
    await runSync(isForce);
  } else {
    await runSync(isForce);
    startWatcher();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
