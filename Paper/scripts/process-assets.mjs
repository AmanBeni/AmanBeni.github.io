/**
 * Asset pipeline for the paper theme.
 *
 * What it does, in plain terms:
 *   Takes the huge original PNGs Aman drops into Paper/References/Lab Files/
 *   and makes small, web-ready copies in Paper/assets/ and public/paper/.
 *   Originals are never touched or moved.
 *
 * Why: the source backgrounds are 6-18 MB each (127 MB total). A website
 * cannot serve those. These copies are typically 100-400 KB and look the same
 * on screen.
 *
 * Run it:   node Paper/scripts/process-assets.mjs
 * Re-run it any time you add new files. It skips anything already processed
 * (unless you pass --force).
 *
 * Naming: "kraft-scan brown lit.png" -> "kraft-scan-brown.webp"
 * (spaces become dashes, the trailing word "lit" is dropped, lowercase).
 */

import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SRC = path.join(ROOT, 'Paper', 'References', 'Lab Files');
const OUT = path.join(ROOT, 'Paper', 'assets');
const PUB = path.join(ROOT, 'public', 'paper');

const FORCE = process.argv.includes('--force');

/**
 * One rule per category:
 *   from      folder name under "Lab Files"
 *   to        folder name under Paper/assets and public/paper
 *   maxWidth  longest edge in pixels for the web copy
 *   format    webp for photos/textures, png when transparency must stay crisp
 */
const RULES = [
  { from: 'backgrounds', to: 'backgrounds', maxWidth: 2000, format: 'webp', quality: 82 },
  { from: '3d images', to: 'objects', maxWidth: 1200, format: 'webp', quality: 88, keepAlpha: true },
  { from: 'Text', to: 'text', maxWidth: 1400, format: 'png', keepAlpha: true },
  { from: 'borders', to: 'borders', maxWidth: 1600, format: 'png', keepAlpha: true },
  { from: 'photos', to: 'photos', maxWidth: 1400, format: 'webp', quality: 86 },
];

/** "kraft-scan brown lit.png" -> "kraft-scan-brown" */
function slug(filename) {
  return path
    .parse(filename)
    .name.toLowerCase()
    .replace(/\s+lit$/, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Human-readable label for the lab picker: "kraft-scan-brown" -> "Kraft Scan Brown" */
function label(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const IMAGE_RE = /\.(png|jpe?g|webp|avif)$/i;

async function processFolder(rule) {
  const srcDir = path.join(SRC, rule.from);
  if (!existsSync(srcDir)) return [];

  const outDir = path.join(OUT, rule.to);
  const pubDir = path.join(PUB, rule.to);
  await mkdir(outDir, { recursive: true });
  await mkdir(pubDir, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => IMAGE_RE.test(f));
  const manifest = [];

  for (const file of files) {
    const name = slug(file);
    const ext = rule.format === 'png' ? 'png' : 'webp';
    const outName = `${name}.${ext}`;
    const outPath = path.join(outDir, outName);
    const pubPath = path.join(pubDir, outName);

    if (!FORCE && existsSync(pubPath)) {
      const meta = await sharp(pubPath).metadata();
      manifest.push(entry(rule, name, outName, meta, (await stat(pubPath)).size));
      continue;
    }

    let img = sharp(path.join(srcDir, file)).rotate();
    const meta = await img.metadata();
    if (meta.width > rule.maxWidth) img = img.resize({ width: rule.maxWidth });

    img =
      rule.format === 'png'
        ? img.png({ compressionLevel: 9, palette: true })
        : img.webp({ quality: rule.quality, alphaQuality: rule.keepAlpha ? 100 : 80 });

    const buf = await img.toBuffer();
    await writeFile(outPath, buf);
    await writeFile(pubPath, buf);

    const outMeta = await sharp(buf).metadata();
    const before = (await stat(path.join(srcDir, file))).size;
    console.log(
      `  ${file}\n    -> ${rule.to}/${outName}  ` +
        `${mb(before)} -> ${mb(buf.length)}  (${outMeta.width}x${outMeta.height})`
    );
    manifest.push(entry(rule, name, outName, outMeta, buf.length));
  }

  return manifest;
}

function entry(rule, name, outName, meta, bytes) {
  return {
    id: `${rule.to}/${name}`,
    category: rule.to,
    name,
    label: label(name),
    src: `/paper/${rule.to}/${outName}`,
    width: meta.width,
    height: meta.height,
    bytes,
  };
}

const mb = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)}MB` : `${Math.round(b / 1e3)}KB`);

async function main() {
  console.log('Processing paper assets...\n');
  const all = [];
  for (const rule of RULES) {
    const items = await processFolder(rule);
    if (items.length) console.log(`${rule.to}: ${items.length} file(s)\n`);
    all.push(...items);
  }

  // The lab reads this at runtime to build its asset pickers.
  await mkdir(PUB, { recursive: true });
  await writeFile(path.join(PUB, 'manifest.json'), JSON.stringify(all, null, 2));

  const total = all.reduce((n, a) => n + a.bytes, 0);
  console.log(`Done. ${all.length} assets, ${mb(total)} total on the web side.`);
  console.log('Manifest: public/paper/manifest.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
