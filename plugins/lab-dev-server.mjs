/**
 * Dev-only Vite middleware for the paper Lab editor.
 *
 * Registered in astro.config.mjs under vite.plugins. Vite only calls
 * configureServer() when running the dev server (`astro dev`), never during
 * `astro build`, so this plugin is naturally inert in production - nothing
 * here ships in dist/.
 *
 * Endpoints (see Paper/LAB-SPEC.md section 6):
 *   GET  /__lab/state    -> Paper/saved/lab-state.json, or {}
 *   POST /__lab/state    -> writes it, snapshots the old one to history/
 *   GET  /__lab/assets   -> public/paper/manifest.json + any unlisted files
 *   POST /__lab/upload   -> multipart upload, re-runs process-assets.mjs
 */

import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SAVED_DIR = path.join(ROOT, 'Paper', 'saved');
const HISTORY_DIR = path.join(SAVED_DIR, 'history');
const STATE_FILE = path.join(SAVED_DIR, 'lab-state.json');
const MANIFEST_FILE = path.join(ROOT, 'public', 'paper', 'manifest.json');
const PUBLIC_PAPER_DIR = path.join(ROOT, 'public', 'paper');
const LAB_FILES_DIR = path.join(ROOT, 'Paper', 'References', 'Lab Files');
const PROCESS_SCRIPT = path.join(ROOT, 'Paper', 'scripts', 'process-assets.mjs');

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|avif|gif)$/i;

// public/paper/<category> <-> Paper/References/Lab Files/<folder>
const CATEGORY_TO_FOLDER = {
  backgrounds: 'backgrounds',
  objects: '3d images',
  text: 'Text',
  borders: 'borders',
  photos: 'photos',
};

function slug(filename) {
  return path
    .parse(filename)
    .name.toLowerCase()
    .replace(/\s+lit$/, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function label(s) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve a user-supplied relative path against a base dir, rejecting escape. */
function safeJoin(base, ...parts) {
  const resolved = path.resolve(base, ...parts);
  const baseResolved = path.resolve(base) + path.sep;
  if (resolved + path.sep !== baseResolved && !resolved.startsWith(baseResolved)) {
    return null;
  }
  return resolved;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

async function handleGetState(req, res) {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    sendJson(res, 200, JSON.parse(raw));
  } catch {
    sendJson(res, 200, {});
  }
}

async function handlePostState(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'invalid json' });
  }
  await fs.mkdir(SAVED_DIR, { recursive: true });
  await fs.mkdir(HISTORY_DIR, { recursive: true });

  if (existsSync(STATE_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const histPath = path.join(HISTORY_DIR, `lab-state-${stamp}.json`);
    try {
      const old = await fs.readFile(STATE_FILE);
      await fs.writeFile(histPath, old);
    } catch {
      // no old file to snapshot, fine
    }
  }

  const payload = {
    version: 1,
    savedAt: new Date().toISOString(),
    note: '',
    theme: {},
    elements: {},
    order: {},
    ...body,
  };

  await fs.writeFile(STATE_FILE, JSON.stringify(payload, null, 2));
  sendJson(res, 200, { ok: true, path: 'Paper/saved/lab-state.json' });
}

async function scanUnlistedAssets(manifest) {
  const known = new Set(manifest.map((m) => m.src));
  const extra = [];
  if (!existsSync(PUBLIC_PAPER_DIR)) return extra;
  const categories = await fs.readdir(PUBLIC_PAPER_DIR, { withFileTypes: true });
  for (const dirent of categories) {
    if (!dirent.isDirectory()) continue;
    const category = dirent.name;
    const dir = path.join(PUBLIC_PAPER_DIR, category);
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!IMAGE_EXT_RE.test(file)) continue;
      const src = `/paper/${category}/${file}`;
      if (known.has(src)) continue;
      const name = slug(file);
      extra.push({
        id: `${category}/${name}`,
        category,
        name,
        label: label(name),
        src,
      });
    }
  }
  return extra;
}

async function handleGetAssets(req, res) {
  let manifest = [];
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf8'));
  } catch {
    manifest = [];
  }
  const extra = await scanUnlistedAssets(manifest);
  sendJson(res, 200, [...manifest, ...extra]);
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = match ? match[1] || match[2] : null;
  if (!boundary) return [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(boundaryBuf);
  while (start !== -1) {
    const next = buffer.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;
    let chunk = buffer.slice(start + boundaryBuf.length, next);
    // strip leading CRLF and trailing CRLF before next boundary
    if (chunk.slice(0, 2).toString() === '\r\n') chunk = chunk.slice(2);
    chunk = chunk.slice(0, chunk.length - 2 >= 0 ? chunk.length - 2 : 0);
    if (chunk.length) {
      const headerEnd = chunk.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        const rawHeaders = chunk.slice(0, headerEnd).toString('utf8');
        const content = chunk.slice(headerEnd + 4);
        const headers = {};
        for (const line of rawHeaders.split('\r\n')) {
          const idx = line.indexOf(':');
          if (idx === -1) continue;
          headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
        }
        parts.push({ headers, content });
      }
    }
    start = next;
  }
  return parts;
}

function parseContentDisposition(value) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(value || ''))) out[m[1]] = m[2];
  return out;
}

async function runProcessAssets() {
  return new Promise((resolve, reject) => {
    execFile('node', [PROCESS_SCRIPT], { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function handleUpload(req, res) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return sendJson(res, 400, { error: 'expected multipart/form-data' });
  }
  const buffer = await readRawBody(req);
  const parts = parseMultipart(buffer, contentType);

  let fileName = null;
  let fileContent = null;
  let category = null;

  for (const part of parts) {
    const disposition = parseContentDisposition(part.headers['content-disposition']);
    if (disposition.name === 'category') {
      category = part.content.toString('utf8').trim();
    } else if (disposition.filename) {
      fileName = path.basename(disposition.filename); // strip any path traversal
      fileContent = part.content;
    }
  }

  if (!fileName || !fileContent) {
    return sendJson(res, 400, { error: 'no file in upload' });
  }
  if (!IMAGE_EXT_RE.test(fileName)) {
    return sendJson(res, 400, { error: 'only image files are allowed' });
  }
  if (!category || !CATEGORY_TO_FOLDER[category]) {
    return sendJson(res, 400, { error: 'unknown or missing category' });
  }

  const folder = CATEGORY_TO_FOLDER[category];
  const destDir = safeJoin(LAB_FILES_DIR, folder);
  if (!destDir) return sendJson(res, 400, { error: 'invalid category path' });
  const destPath = safeJoin(destDir, fileName);
  if (!destPath) return sendJson(res, 400, { error: 'invalid file name' });

  await fs.mkdir(destDir, { recursive: true });
  await fs.writeFile(destPath, fileContent);

  try {
    await runProcessAssets();
  } catch (err) {
    return sendJson(res, 500, { error: `upload saved but processing failed: ${err.message}` });
  }

  let manifest = [];
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf8'));
  } catch {
    manifest = [];
  }
  sendJson(res, 200, { ok: true, manifest });
}

export default function labDevServer() {
  return {
    name: 'lab-dev-server',
    apply: 'serve', // dev only; never runs during `astro build` / `vite build`
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/__lab/')) return next();
        const [urlPath] = req.url.split('?');
        try {
          if (urlPath === '/__lab/state' && req.method === 'GET') {
            return await handleGetState(req, res);
          }
          if (urlPath === '/__lab/state' && req.method === 'POST') {
            return await handlePostState(req, res);
          }
          if (urlPath === '/__lab/assets' && req.method === 'GET') {
            return await handleGetAssets(req, res);
          }
          if (urlPath === '/__lab/upload' && req.method === 'POST') {
            return await handleUpload(req, res);
          }
          return next();
        } catch (err) {
          sendJson(res, 500, { error: err.message || String(err) });
        }
      });
    },
  };
}
