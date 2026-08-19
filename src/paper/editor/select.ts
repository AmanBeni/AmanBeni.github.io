/**
 * Discovers editable elements purely from data-lab-* attributes (section 2),
 * and manages selection: click-to-select, keyboard nav, and the highlight
 * overlay drawn over the selected element. The overlay lives in its own
 * fixed layer and never wraps page content.
 */

import type { LabKind } from './state';

export interface Registration {
  id: string;
  el: HTMLElement;
  kind: LabKind;
  label: string;
  group: string;
  props: string[];
  variantOf: string | null;
  asset: string | null;
  canvas: HTMLElement | null; // nearest data-lab-canvas ancestor, for free elements
}

export class Registry {
  byId = new Map<string, Registration>();
  order: string[] = []; // DOM order of ids, for Tab navigation

  scan(): void {
    this.byId.clear();
    this.order = [];
    const nodes = document.querySelectorAll<HTMLElement>('[data-lab-id]');
    nodes.forEach((el) => {
      const id = el.dataset.labId!;
      const kind = (el.dataset.labKind as LabKind) || 'flow';
      const reg: Registration = {
        id,
        el,
        kind,
        label: el.dataset.labLabel || id,
        group: el.dataset.labGroup || 'Ungrouped',
        props: (el.dataset.labProps || '').split(',').map((s) => s.trim()).filter(Boolean),
        variantOf: el.dataset.labVariantOf || null,
        asset: el.dataset.labAsset || null,
        canvas: kind === 'free' ? el.closest<HTMLElement>('[data-lab-canvas]') : null,
      };
      this.byId.set(id, reg);
      this.order.push(id);
    });
  }

  groups(): Map<string, Registration[]> {
    const out = new Map<string, Registration[]>();
    for (const id of this.order) {
      const reg = this.byId.get(id)!;
      if (!out.has(reg.group)) out.set(reg.group, []);
      out.get(reg.group)!.push(reg);
    }
    return out;
  }

  /** Siblings sharing the same parent element, in current DOM order. */
  siblingsOf(id: string): Registration[] {
    const reg = this.byId.get(id);
    if (!reg) return [];
    const parent = reg.el.parentElement;
    if (!parent) return [reg];
    const siblings: Registration[] = [];
    for (const child of Array.from(parent.children)) {
      const cid = (child as HTMLElement).dataset?.labId;
      if (cid && this.byId.has(cid)) siblings.push(this.byId.get(cid)!);
    }
    return siblings;
  }
}

type SelectListener = (id: string | null) => void;

export class Selection {
  private registry: Registry;
  private selectedId: string | null = null;
  private listeners = new Set<SelectListener>();
  overlay: HTMLDivElement;
  handles: Record<string, HTMLDivElement> = {};

  constructor(registry: Registry, layer: HTMLElement) {
    this.registry = registry;
    this.overlay = document.createElement('div');
    this.overlay.className = 'lab-overlay';
    this.overlay.style.display = 'none';
    layer.appendChild(this.overlay);

    const handleNames = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'rotate'];
    for (const name of handleNames) {
      const h = document.createElement('div');
      h.className = `lab-handle lab-handle-${name}`;
      h.dataset.handle = name;
      this.overlay.appendChild(h);
      this.handles[name] = h;
    }

    window.addEventListener('scroll', () => this.reposition(), true);
    window.addEventListener('resize', () => this.reposition());
  }

  onSelect(fn: SelectListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get current(): Registration | null {
    return this.selectedId ? this.registry.byId.get(this.selectedId) ?? null : null;
  }

  select(id: string | null): void {
    this.selectedId = id;
    const reg = id ? this.registry.byId.get(id) : null;
    if (reg) {
      this.overlay.style.display = '';
      reg.el.classList.add('lab-selected-target');
      this.reposition();
    } else {
      this.overlay.style.display = 'none';
    }
    document.querySelectorAll('.lab-selected-target').forEach((el) => {
      if (!reg || el !== reg.el) el.classList.remove('lab-selected-target');
    });
    for (const fn of this.listeners) fn(id);
  }

  reposition(): void {
    const reg = this.current;
    if (!reg) return;
    const rect = reg.el.getBoundingClientRect();
    this.overlay.style.left = `${rect.left}px`;
    this.overlay.style.top = `${rect.top}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    const showResize = reg.props.some((p) => ['maxWidth', 'scale'].includes(p));
    const showRotate = reg.props.includes('rotate');
    for (const [name, el] of Object.entries(this.handles)) {
      if (name === 'rotate') el.style.display = showRotate ? '' : 'none';
      else el.style.display = showResize ? '' : 'none';
    }
  }

  next(): void {
    const order = this.registry.order;
    if (!order.length) return;
    const idx = this.selectedId ? order.indexOf(this.selectedId) : -1;
    const nextId = order[(idx + 1) % order.length];
    this.select(nextId);
  }

  deselect(): void {
    this.select(null);
  }
}

/** Wires document-level click delegation for selecting elements in edit mode. */
export function setupClickSelection(registry: Registry, selection: Selection, isEditing: () => boolean): void {
  document.addEventListener(
    'click',
    (e) => {
      if (!isEditing()) return;
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-lab-id]');
      if (!target) {
        if (!(e.target as HTMLElement).closest('.lab-panel')) selection.deselect();
        return;
      }
      const id = target.dataset.labId!;
      if (!registry.byId.has(id)) return;
      e.preventDefault();
      e.stopPropagation();
      selection.select(id);
    },
    true,
  );
}
