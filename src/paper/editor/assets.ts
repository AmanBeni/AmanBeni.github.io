/**
 * Asset picker: fetches the manifest from the dev server, renders thumbnail
 * grids filtered by category, and uploads new files.
 */

export interface AssetEntry {
  id: string;
  category: string;
  name: string;
  label: string;
  src: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export async function fetchManifest(): Promise<AssetEntry[]> {
  try {
    const res = await fetch('/__lab/assets');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function renderAssetGrid(
  container: HTMLElement,
  manifest: AssetEntry[],
  category: string,
  onPick: (assetId: string) => void,
): void {
  container.innerHTML = '';
  const items = manifest.filter((m) => m.category === category);
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'lab-empty';
    empty.textContent = 'No assets yet.';
    container.appendChild(empty);
    return;
  }
  for (const item of items) {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'lab-asset-thumb';
    thumb.title = item.label;
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.label;
    img.loading = 'lazy';
    thumb.appendChild(img);
    thumb.addEventListener('click', () => onPick(item.id));
    container.appendChild(thumb);
  }
}

export async function uploadAsset(
  file: File,
  category: string,
): Promise<{ ok: boolean; manifest?: AssetEntry[]; error?: string }> {
  const form = new FormData();
  form.append('category', category);
  form.append('file', file, file.name);
  try {
    const res = await fetch('/__lab/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) return { ok: true, manifest: data.manifest };
    return { ok: false, error: data.error || 'upload failed' };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
