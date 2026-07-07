#!/usr/bin/env node
/*
 * build-covers.mjs — bygger gn/covers/manifest.json från bilderna som ligger i mappen.
 *
 * Använd så här:
 *   1. Lägg era omslag (jpg/jpeg/png/webp) i mappen gn/covers/
 *   2. Kör:  node gn/build-covers.mjs
 *   3. Alla omslag dyker upp som förvalda motiv i studion.
 *
 * Etiketten (namnet som visas) gissas fram ur filnamnet — städa gärna
 * i manifest.json efteråt om något blir fult.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'covers');
const IMG = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/* Gör "Ghost-Nation---Unholy-Album-Cover-utan-text.jpg" → "Unholy" */
function labelFrom(name) {
  return basename(name, extname(name))
    .replace(/ghost[\s_-]*nation/ig, '')
    .replace(/album|cover|art|utan[\s_-]*text|without[\s_-]*text|original(foto)?|cdbaby|large|red/ig, '')
    .replace(/\b\d{3,4}\b/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s*\d+\s*\)/g, '')
    .trim() || basename(name, extname(name));
}

const files = readdirSync(dir)
  .filter(f => IMG.has(extname(f).toLowerCase()))
  .sort();

const manifest = files.map(f => ({ file: f, label: labelFrom(f) }));
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Skrev manifest.json med ${manifest.length} omslag.`);
manifest.forEach(m => console.log(`  ${m.label}  ←  ${m.file}`));
