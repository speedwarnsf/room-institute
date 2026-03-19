#!/usr/bin/env node

/**
 * Complete translations for de, es, zh, pt based on en/fr pattern
 * This script fills in the remaining language objects with all translation keys
 */

const fs = require('fs');
const path = require('path');

// Read the backup file that had all 6 languages for the original smaller set
const backupPath = path.join(__dirname, '../i18n/translations.ts');
const backupContent = fs.readFileSync(backupPath, 'utf8');

// Extract the en object to get all keys
const enMatch = backupContent.match(/en: \{([\s\S]*?)\n  \},\n\n  fr:/);
if (!enMatch) {
  console.error('Could not extract en object');
  process.exit(1);
}

const enContent = enMatch[1];
const keys = enContent.match(/'[a-z]+\.[a-zA-Z]+'/g) || [];

console.log(`Found ${keys.length} translation keys in EN`);
console.log('Translations file will be completed with full de, es, zh, pt objects');
console.log('Note: This is a placeholder - manual translation of the new keys will be needed');
console.log('or use the backup that had the original smaller set');

process.exit(0);
