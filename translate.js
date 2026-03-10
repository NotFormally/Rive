require('dotenv').config({ path: '/Users/nassim/RiveHub/.env.local' });
const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const messagesDir = '/Users/nassim/RiveHub/messages';

const langMap = {
  'ar.json': 'Arabic',
  'bn.json': 'Bengali',
  'de.json': 'German',
  'es.json': 'Spanish',
  'fr.json': 'French',
  'hi.json': 'Hindi',
  'id.json': 'Indonesian',
  'it.json': 'Italian',
  'ja.json': 'Japanese',
  'ko.json': 'Korean',
  'ms.json': 'Malay',
  'nan.json': 'Min Nan Chinese (Taiwanese Hokkien)',
  'nl.json': 'Dutch',
  'pa.json': 'Punjabi',
  'pl.json': 'Polish',
  'pt.json': 'Portuguese',
  'ru.json': 'Russian',
  'ta.json': 'Tamil',
  'th.json': 'Thai',
  'tl.json': 'Tagalog / Filipino',
  'tr.json': 'Turkish',
  'vi.json': 'Vietnamese',
  'zh-CN.json': 'Simplified Chinese',
  'zh-HK.json': 'Traditional Chinese (Hong Kong)'
};

function getNestedKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getNestedKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
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
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

async function translateKeys(missingObj, targetLangName) {
  const prompt = `Translate the values in this JSON object from English to ${targetLangName}. 
Maintain the exact JSON structure and keys. Do not return any markdown code blocks (like \`\`\`json), just the raw JSON object string. Do not include any explanations. Let the first character of your response be { and the last be }.

JSON to translate:
${JSON.stringify(missingObj, null, 2)}`;

  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }]
  });

  return msg.content[0].text;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

async function processFile(file, enKeys, enJson) {
  const targetRaw = fs.readFileSync(path.join(messagesDir, file), 'utf8');
  let targetJson;
  try {
    targetJson = JSON.parse(targetRaw);
  } catch (e) {
    console.error(`Error parsing ${file}`);
    return false;
  }

  const currentKeysSet = new Set(getNestedKeys(targetJson));
  const missingKeys = enKeys.filter(k => !currentKeysSet.has(k));

  if (missingKeys.length === 0) {
    console.log(`${file}: 0 missing keys. Skipping.`);
    return true;
  }

  console.log(`Processing ${file}... (${missingKeys.length} keys)`);
  const langName = langMap[file] || file.replace('.json', '');
  
  const BATCH_SIZE = 5;

  for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
    const chunkKeys = missingKeys.slice(i, i + BATCH_SIZE);
    console.log(`  Translating chunk ${Math.floor(i / BATCH_SIZE) + 1} for ${file}...`);
    const toTranslate = {};
    for (const key of chunkKeys) {
      const val = getNestedValue(enJson, key);
      if (val !== undefined) setNestedValue(toTranslate, key, val);
    }

    try {
      const translatedRaw = await translateKeys(toTranslate, langName);
      
      let chunkObj;
      try {
          const cleanRaw = translatedRaw.replace(/^\s*```json\s*/im, '').replace(/\s*```\s*$/im, '').trim();
          chunkObj = JSON.parse(cleanRaw);
      } catch (e) {
          console.error(`Failed to parse response chunk for ${file}:`, translatedRaw.substring(0, 100) + '...');
          continue;
      }
      deepMerge(targetJson, chunkObj);
      fs.writeFileSync(path.join(messagesDir, file), JSON.stringify(targetJson, null, 2) + '\n');
    } catch (e) {
      console.error(`Error processing chunk for ${file}:`, e.message);
      continue;
    }
  }

  console.log(`Successfully updated ${file}`);
  return true;
}

async function main() {
  const enRaw = fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8');
  const enJson = JSON.parse(enRaw);
  const enKeys = getNestedKeys(enJson);
  
  const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== 'en.json');
  
  const CONCURRENCY = 3;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(file => processFile(file, enKeys, enJson)));
  }
  console.log('All missing translations processed!');
}

main();
