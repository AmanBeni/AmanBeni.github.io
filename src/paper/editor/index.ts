/**
 * Entry point: boot, keyboard shortcuts, and applying saved state to the
 * live DOM. Import this once from the Lab page.
 *
 * Everything is gated behind `import.meta.env.DEV`. In a production build
 * this whole branch is statically false, so bundlers dead-code-eliminate it
 * (including the dynamic `import('./editor.css')`) - the editor ships no JS
 * or CSS in `npm run build`. See Paper/LAB-SPEC.md section 9.
 */

import { LabStore, applyPropToElement, setAssetManifest, setTransformPart, type LabKind } from './state';
import { Registry, Selection, setupClickSelection } from './select';
import { DragController, applyOrder, nudge } from './drag';
import { Panel } from './panel';
import { fetchManifest } from './assets';

async function boot(): Promise<void> {
  await import('./editor.css');

  const registry = new Registry();
  registry.scan();

  const store = new LabStore();
  await store.load();

  const manifest = await fetchManifest();
  setAssetManifest(manifest);

  const layer = document.createElement('div');
  layer.className = 'lab-editor-layer';
  document.body.appendChild(layer);

  const selection = new Selection(registry, layer);
  const panel = new Panel(store, registry, selection);
  panel.root.style.pointerEvents = 'auto';
  layer.appendChild(panel.root);
  panel.wireUploads();

  const dragController = new DragController(store, registry, selection);
  dragController.attach(layer);

  setupClickSelection(registry, selection, () => document.body.classList.contains('lab-editing'));

  applyFullState();
  panel.syncOrderFromState();

  function applyFullState(): void {
    for (const [id, reg] of registry.byId) {
      const entry = store.getElement(id);
      reg.el.style.display = entry.hidden ? 'none' : '';
      const kind: LabKind = (entry.kind as LabKind) || reg.kind;
      for (const [prop, value] of Object.entries(entry)) {
        if (['kind', 'hidden', 'variantActive'].includes(prop)) continue;
        if (prop === 'rotate' || prop === 'scale') setTransformPart(reg.el, prop as 'rotate' | 'scale', Number(value));
        else applyPropToElement(reg.el, prop, value, kind);
      }
    }
    for (const [containerId, order] of Object.entries(store.state.order)) {
      applyOrder(registry, order);
      void containerId;
    }
    for (const reg of registry.byId.values()) {
      if (!reg.variantOf) continue;
      const active = store.getElement(reg.variantOf).variantActive;
      if (active) reg.el.style.display = active !== reg.id ? 'none' : '';
    }
  }

  function isTypingTarget(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
  }

  const hint = document.createElement('div');
  hint.className = 'lab-hint-badge';
  hint.textContent = 'Press E to edit';
  document.body.appendChild(hint);

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e)) return;

    if (e.key === 'e' || e.key === 'E') {
      const editing = document.body.classList.toggle('lab-editing');
      layer.style.display = editing ? '' : 'none';
      hint.style.display = editing ? 'none' : '';
      if (!editing) selection.deselect();
      return;
    }

    if (!document.body.classList.contains('lab-editing')) return;

    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) store.redo();
      else store.undo();
      registry.scan();
      applyFullState();
      return;
    }
    if (meta && e.key.toLowerCase() === 's') {
      e.preventDefault();
      panel.setTab('layers'); // harmless nudge so the panel reflects state
      void store.saveToServer(store.state.note);
      return;
    }
    if (e.key === 'Escape') {
      selection.deselect();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      selection.next();
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      const reg = selection.current;
      if (!reg) return;
      e.preventDefault();
      const big = e.shiftKey;
      const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
      nudge(store, reg, dx, dy, big);
      selection.reposition();
      return;
    }
  });

  layer.style.display = 'none';
}

if (import.meta.env.DEV) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot());
  } else {
    void boot();
  }
}
