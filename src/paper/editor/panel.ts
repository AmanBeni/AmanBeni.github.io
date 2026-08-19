/**
 * The side panel: Layers / Properties / Theme / Assets tabs, save/reset,
 * breakpoint preview, and the toast that confirms a save. Panel width and
 * last-open tab are remembered in localStorage.
 */

import { LabStore, applyPropToElement, setTransformPart } from './state';
import { Registry, Selection, type Registration } from './select';
import { applyOrder } from './drag';
import { fetchManifest, renderAssetGrid, type AssetEntry, uploadAsset } from './assets';

type PropControl =
  | { kind: 'slider'; min: number; max: number; step: number; unit?: string }
  | { kind: 'segmented'; options: string[] }
  | { kind: 'dropdown'; options: string[] }
  | { kind: 'swatches'; options: string[] }
  | { kind: 'asset' }
  | { kind: 'toggle' };

const PROP_META: Record<string, PropControl> = {
  fontSize: { kind: 'slider', min: 10, max: 160, step: 1, unit: 'px' },
  lineHeight: { kind: 'slider', min: 0.8, max: 2.4, step: 0.05 },
  letterSpacing: { kind: 'slider', min: -0.1, max: 0.4, step: 0.01, unit: 'em' },
  fontWeight: { kind: 'segmented', options: ['300', '400', '500', '600', '700'] },
  font: { kind: 'dropdown', options: ['display', 'body', 'mono'] },
  color: { kind: 'swatches', options: ['ink', 'ink-soft', 'accent'] },
  align: { kind: 'segmented', options: ['left', 'center', 'right'] },
  maxWidth: { kind: 'slider', min: 20, max: 100, step: 1, unit: '%' },
  marginTop: { kind: 'slider', min: -80, max: 200, step: 4, unit: 'px' },
  marginBottom: { kind: 'slider', min: -80, max: 200, step: 4, unit: 'px' },
  paddingTop: { kind: 'slider', min: 0, max: 240, step: 4, unit: 'px' },
  paddingBottom: { kind: 'slider', min: 0, max: 240, step: 4, unit: 'px' },
  gap: { kind: 'slider', min: 0, max: 120, step: 4, unit: 'px' },
  background: { kind: 'asset' },
  x: { kind: 'slider', min: 0, max: 100, step: 0.5, unit: '%' },
  y: { kind: 'slider', min: 0, max: 100, step: 0.5, unit: '%' },
  rotate: { kind: 'slider', min: -30, max: 30, step: 1, unit: 'deg' },
  scale: { kind: 'slider', min: 0.2, max: 3, step: 0.05 },
  z: { kind: 'slider', min: 0, max: 20, step: 1 },
  opacity: { kind: 'slider', min: 0, max: 1, step: 0.05 },
  shadow: { kind: 'segmented', options: ['none', 'soft', 'lifted', 'deep'] },
  src: { kind: 'asset' },
};

const THEME_VARS = [
  '--paper-stock',
  '--paper-tint',
  '--ink',
  '--ink-soft',
  '--accent',
  '--font-display',
  '--font-body',
  '--font-mono',
  '--grain',
  '--edge',
];

const BREAKPOINTS: Record<string, string | null> = {
  Desktop: null,
  Tablet: '768px',
  Phone: '390px',
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class Panel {
  root: HTMLDivElement;
  private body: HTMLDivElement;
  private tabs: Record<string, HTMLButtonElement> = {};
  private activeTab = 'layers';
  private manifest: AssetEntry[] = [];

  constructor(
    private store: LabStore,
    private registry: Registry,
    private selection: Selection,
  ) {
    this.root = el('div', 'lab-panel');
    const savedWidth = localStorage.getItem('lab-panel-width');
    if (savedWidth) this.root.style.width = `${savedWidth}px`;

    const resizer = el('div', 'lab-panel-resizer');
    this.root.appendChild(resizer);
    this.wireResizer(resizer);

    const tabBar = el('div', 'lab-tabbar');
    for (const name of ['layers', 'properties', 'theme', 'assets']) {
      const btn = el('button', 'lab-tab', capitalize(name));
      btn.type = 'button';
      btn.addEventListener('click', () => this.setTab(name));
      tabBar.appendChild(btn);
      this.tabs[name] = btn;
    }
    this.root.appendChild(tabBar);

    const toolbar = el('div', 'lab-toolbar');
    const bpBar = el('div', 'lab-bpbar');
    for (const name of Object.keys(BREAKPOINTS)) {
      const btn = el('button', 'lab-bp-btn', name);
      btn.type = 'button';
      btn.addEventListener('click', () => this.setBreakpoint(name));
      bpBar.appendChild(btn);
    }
    toolbar.appendChild(bpBar);

    const saveBtn = el('button', 'lab-save-btn', 'Save (Cmd+S)');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', () => this.save());
    toolbar.appendChild(saveBtn);

    const resetBtn = el('button', 'lab-reset-btn', 'Reset all');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => this.resetAll());
    toolbar.appendChild(resetBtn);

    this.root.appendChild(toolbar);

    this.body = el('div', 'lab-panel-body');
    this.root.appendChild(this.body);

    this.setTab('layers');
    store.onChange(() => this.render());
    selection.onSelect(() => this.render());

    fetchManifest().then((m) => {
      this.manifest = m;
      this.render();
    });
  }

  private wireResizer(resizer: HTMLDivElement): void {
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = this.root.getBoundingClientRect().width;
      const onMove = (ev: MouseEvent) => {
        const width = Math.min(600, Math.max(240, startWidth - (ev.clientX - startX)));
        this.root.style.width = `${width}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        localStorage.setItem('lab-panel-width', String(this.root.getBoundingClientRect().width));
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  setTab(name: string): void {
    this.activeTab = name;
    for (const [key, btn] of Object.entries(this.tabs)) {
      btn.classList.toggle('lab-tab-active', key === name);
    }
    this.render();
  }

  setBreakpoint(name: string): void {
    const width = BREAKPOINTS[name];
    document.documentElement.style.setProperty('--lab-bp-width', width || 'none');
    document.body.classList.toggle('lab-bp-active', !!width);
  }

  private async save(): Promise<void> {
    const note = window.prompt('Note for this save (optional):', this.store.state.note || '') ?? '';
    const result = await this.store.saveToServer(note);
    this.toast(result.ok ? `Saved to ${result.path}` : `Save failed: ${result.error}`, result.ok);
  }

  private resetAll(): void {
    if (!window.confirm('Reset every override? This cannot be undone.')) return;
    this.store.mutate((s) => {
      s.elements = {};
      s.theme = {};
      s.order = {};
    });
    location.reload();
  }

  private toast(message: string, ok = true): void {
    const t = el('div', `lab-toast ${ok ? 'lab-toast-ok' : 'lab-toast-error'}`, message);
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('lab-toast-visible'));
    setTimeout(() => {
      t.classList.remove('lab-toast-visible');
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }

  render(): void {
    this.body.innerHTML = '';
    if (this.activeTab === 'layers') this.renderLayers();
    else if (this.activeTab === 'properties') this.renderProperties();
    else if (this.activeTab === 'theme') this.renderTheme();
    else if (this.activeTab === 'assets') this.renderAssets();
  }

  private renderLayers(): void {
    const groups = this.registry.groups();
    for (const [groupName, regs] of groups) {
      const groupEl = el('div', 'lab-layer-group');
      groupEl.appendChild(el('div', 'lab-layer-group-title', groupName));
      for (const reg of regs) {
        const row = el('div', 'lab-layer-row');
        if (this.selection.current?.id === reg.id) row.classList.add('lab-layer-row-active');
        const state = this.store.getElement(reg.id);

        const eye = el('button', 'lab-eye-btn', state.hidden ? 'Hidden' : 'Shown');
        eye.type = 'button';
        eye.addEventListener('click', (e) => {
          e.stopPropagation();
          this.store.mutate(() => this.store.toggleHidden(reg.id));
          reg.el.style.display = this.store.getElement(reg.id).hidden ? 'none' : '';
        });

        const label = el('div', 'lab-layer-label', reg.label);
        row.appendChild(eye);
        row.appendChild(label);
        row.addEventListener('click', () => this.selection.select(reg.id));

        if (reg.kind === 'free') {
          row.draggable = true;
          row.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/lab-id', reg.id);
          });
          row.addEventListener('dragover', (e) => e.preventDefault());
          row.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer?.getData('text/lab-id');
            if (draggedId && draggedId !== reg.id) this.reorderFree(draggedId, reg.id);
          });
        }

        groupEl.appendChild(row);

        if (reg.variantOf) {
          // Rendered alongside its pair, marked as a variant toggle.
          row.classList.add('lab-layer-variant');
        }
      }
      this.body.appendChild(groupEl);
    }
  }

  private reorderFree(draggedId: string, targetId: string): void {
    const dragged = this.registry.byId.get(draggedId);
    const target = this.registry.byId.get(targetId);
    if (!dragged || !target) return;
    const draggedZ = Number(this.store.getElement(draggedId).z ?? 0);
    const targetZ = Number(this.store.getElement(targetId).z ?? 0);
    this.store.mutate(() => {
      this.store.setElementProp(draggedId, 'z', targetZ);
      this.store.setElementProp(targetId, 'z', draggedZ);
    });
    applyPropToElement(dragged.el, 'z', targetZ, 'free');
    applyPropToElement(target.el, 'z', draggedZ, 'free');
  }

  private renderProperties(): void {
    const reg = this.selection.current;
    if (!reg) {
      this.body.appendChild(el('div', 'lab-empty', 'Select an element to edit its properties.'));
      return;
    }
    this.body.appendChild(el('div', 'lab-props-title', reg.label));

    // Variant toggle, if this element is part of a variant pair.
    if (reg.variantOf) {
      const btn = el('button', 'lab-variant-btn', 'Make active variant');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.store.mutate(() => this.store.setVariantActive(reg.variantOf!, reg.id));
        this.applyVariants();
      });
      this.body.appendChild(btn);
    }

    for (const prop of reg.props) {
      const meta = PROP_META[prop];
      if (!meta) continue;
      this.body.appendChild(this.renderControl(reg, prop, meta));
    }

    const opacityMeta = PROP_META.opacity;
    if (!reg.props.includes('opacity')) {
      this.body.appendChild(this.renderControl(reg, 'opacity', opacityMeta));
    }

    const resetBtn = el('button', 'lab-reset-selection-btn', 'Reset this element');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      this.store.mutate(() => this.store.resetElement(reg.id));
      location.reload();
    });
    this.body.appendChild(resetBtn);
  }

  private renderControl(reg: Registration, prop: string, meta: PropControl): HTMLElement {
    const wrap = el('div', 'lab-control');
    wrap.appendChild(el('label', 'lab-control-label', prop));
    const stored = this.store.getElement(reg.id)[prop];
    const current = stored !== undefined ? stored : readCurrentValue(reg, prop);

    const commit = (value: unknown) => {
      this.store.mutate(() => this.store.setElementProp(reg.id, prop, value));
      if (prop === 'rotate' || prop === 'scale') setTransformPart(reg.el, prop, Number(value));
      else applyPropToElement(reg.el, prop, value, reg.kind);
    };

    if (meta.kind === 'slider') {
      const row = el('div', 'lab-control-row');
      const slider = el('input', 'lab-slider') as HTMLInputElement;
      slider.type = 'range';
      slider.min = String(meta.min);
      slider.max = String(meta.max);
      slider.step = String(meta.step);
      const defaultVal = prop === 'opacity' ? 1 : prop === 'lineHeight' ? 1.4 : prop === 'scale' ? 1 : meta.min;
      slider.value = String(current ?? defaultVal);
      slider.value = String(clampToRange(Number(slider.value), meta.min, meta.max));
      const number = el('input', 'lab-number') as HTMLInputElement;
      number.type = 'number';
      number.value = slider.value;
      slider.addEventListener('input', () => {
        number.value = slider.value;
        commit(Number(slider.value));
      });
      number.addEventListener('change', () => {
        slider.value = number.value;
        commit(Number(number.value));
      });
      row.appendChild(slider);
      row.appendChild(number);
      if (meta.unit) row.appendChild(el('span', 'lab-unit', meta.unit));
      wrap.appendChild(row);
    } else if (meta.kind === 'segmented') {
      const row = el('div', 'lab-segmented');
      for (const opt of meta.options) {
        const btn = el('button', 'lab-seg-btn', opt);
        btn.type = 'button';
        if (String(current) === opt) btn.classList.add('lab-seg-active');
        btn.addEventListener('click', () => {
          row.querySelectorAll('.lab-seg-btn').forEach((b) => b.classList.remove('lab-seg-active'));
          btn.classList.add('lab-seg-active');
          commit(opt);
        });
        row.appendChild(btn);
      }
      wrap.appendChild(row);
    } else if (meta.kind === 'dropdown') {
      const select = el('select', 'lab-select') as HTMLSelectElement;
      for (const opt of meta.options) {
        const optionEl = el('option', '', opt);
        (optionEl as HTMLOptionElement).value = opt;
        select.appendChild(optionEl);
      }
      if (current) select.value = String(current);
      select.addEventListener('change', () => commit(select.value));
      wrap.appendChild(select);
    } else if (meta.kind === 'swatches') {
      const row = el('div', 'lab-swatches');
      for (const opt of meta.options) {
        const swatch = el('button', 'lab-swatch');
        swatch.type = 'button';
        swatch.style.background = `var(--${opt})`;
        swatch.title = opt;
        swatch.addEventListener('click', () => commit(opt));
        row.appendChild(swatch);
      }
      const hex = el('input', 'lab-hex') as HTMLInputElement;
      hex.type = 'text';
      hex.placeholder = '#hex';
      hex.addEventListener('change', () => commit(hex.value));
      row.appendChild(hex);
      wrap.appendChild(row);
    } else if (meta.kind === 'asset') {
      const category = reg.asset || 'backgrounds';
      const grid = el('div', 'lab-asset-mini-grid');
      renderAssetGrid(grid, this.manifest, category, (assetId) => commit(assetId));
      wrap.appendChild(grid);
    }
    return wrap;
  }

  private applyVariants(): void {
    for (const reg of this.registry.byId.values()) {
      if (!reg.variantOf) continue;
      const active = this.store.getElement(reg.variantOf).variantActive;
      reg.el.style.display = active && active !== reg.id ? 'none' : '';
    }
  }

  private renderTheme(): void {
    for (const varName of THEME_VARS) {
      const wrap = el('div', 'lab-control');
      wrap.appendChild(el('label', 'lab-control-label', varName));
      const current = this.store.state.theme[varName] || '';
      if (varName === '--paper-stock') {
        const grid = el('div', 'lab-asset-mini-grid');
        renderAssetGrid(grid, this.manifest, 'backgrounds', (assetId) => {
          const asset = this.manifest.find((m) => m.id === assetId);
          const value = asset ? `url(${asset.src})` : assetId;
          this.store.mutate(() => this.store.setTheme(varName, value));
          document.documentElement.style.setProperty(varName, value);
        });
        wrap.appendChild(grid);
      } else if (varName === '--grain') {
        const slider = el('input', 'lab-slider') as HTMLInputElement;
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = current || '0.35';
        slider.addEventListener('input', () => {
          this.store.mutate(() => this.store.setTheme(varName, slider.value));
          document.documentElement.style.setProperty(varName, slider.value);
        });
        wrap.appendChild(slider);
      } else {
        const input = el('input', 'lab-text-input') as HTMLInputElement;
        input.type = 'text';
        input.value = current;
        input.addEventListener('change', () => {
          this.store.mutate(() => this.store.setTheme(varName, input.value));
          document.documentElement.style.setProperty(varName, input.value);
        });
        wrap.appendChild(input);
      }
      this.body.appendChild(wrap);
    }
  }

  private renderAssets(): void {
    const categories = ['backgrounds', 'objects', 'text', 'borders', 'photos'];
    for (const category of categories) {
      this.body.appendChild(el('div', 'lab-layer-group-title', capitalize(category)));
      const grid = el('div', 'lab-asset-grid');
      renderAssetGrid(grid, this.manifest, category, (assetId) => {
        const reg = this.selection.current;
        if (!reg) return;
        const prop = reg.props.includes('src') ? 'src' : 'background';
        this.store.mutate(() => this.store.setElementProp(reg.id, prop, assetId));
        applyPropToElement(reg.el, prop, assetId, reg.kind);
      });
      this.body.appendChild(grid);
    }

    const dropHint = el('div', 'lab-drop-hint', 'Drag files from Finder onto the page to upload.');
    this.body.appendChild(dropHint);
  }

  wireUploads(): void {
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', async (e) => {
      if (!document.body.classList.contains('lab-editing')) return;
      const files = e.dataTransfer?.files;
      if (!files || !files.length) return;
      e.preventDefault();
      const category = window.prompt(
        'Category for this upload (backgrounds, objects, text, borders, photos):',
        'objects',
      );
      if (!category) return;
      for (const file of Array.from(files)) {
        const result = await uploadAsset(file, category);
        if (result.ok && result.manifest) {
          this.manifest = result.manifest;
          this.toast(`Uploaded ${file.name}`);
          this.render();
        } else {
          this.toast(`Upload failed: ${result.error}`, false);
        }
      }
    });
  }

  syncOrderFromState(): void {
    for (const [containerId, order] of Object.entries(this.store.state.order)) {
      applyOrder(this.registry, order);
      void containerId;
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clampToRange(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Reads the element's real current value for a prop from computed style,
 * so a slider for an untouched element starts at what's actually on screen
 * instead of silently jumping to the control's minimum.
 */
function readCurrentValue(reg: Registration, prop: string): number | string | undefined {
  const computed = getComputedStyle(reg.el);
  const fontSizePx = parseFloat(computed.fontSize) || 16;
  switch (prop) {
    case 'fontSize':
      return Math.round(fontSizePx);
    case 'lineHeight': {
      const lh = computed.lineHeight;
      if (lh === 'normal') return 1.4;
      const px = parseFloat(lh);
      return Number.isNaN(px) ? 1.4 : Number((px / fontSizePx).toFixed(2));
    }
    case 'letterSpacing': {
      const ls = computed.letterSpacing;
      if (ls === 'normal') return 0;
      const px = parseFloat(ls);
      return Number.isNaN(px) ? 0 : Number((px / fontSizePx).toFixed(3));
    }
    case 'fontWeight':
      return computed.fontWeight;
    case 'align':
      return computed.textAlign;
    case 'maxWidth': {
      const parent = reg.el.parentElement;
      const parentWidth = parent ? parent.getBoundingClientRect().width : 0;
      const ownWidth = reg.el.getBoundingClientRect().width;
      if (!parentWidth) return 100;
      return Math.round(Math.min(100, (ownWidth / parentWidth) * 100));
    }
    case 'marginTop':
      return Math.round(parseFloat(computed.marginTop)) || 0;
    case 'marginBottom':
      return Math.round(parseFloat(computed.marginBottom)) || 0;
    case 'paddingTop':
      return Math.round(parseFloat(computed.paddingTop)) || 0;
    case 'paddingBottom':
      return Math.round(parseFloat(computed.paddingBottom)) || 0;
    case 'gap':
      return Math.round(parseFloat(computed.gap)) || 0;
    case 'opacity':
      return Number(computed.opacity) || 1;
    case 'z':
      return Number(computed.zIndex) || 0;
    case 'x': {
      if (!reg.canvas) return 0;
      const canvasRect = reg.canvas.getBoundingClientRect();
      const rect = reg.el.getBoundingClientRect();
      return Number((((rect.left - canvasRect.left) / canvasRect.width) * 100).toFixed(2));
    }
    case 'y': {
      if (!reg.canvas) return 0;
      const canvasRect = reg.canvas.getBoundingClientRect();
      const rect = reg.el.getBoundingClientRect();
      return Number((((rect.top - canvasRect.top) / canvasRect.height) * 100).toFixed(2));
    }
    case 'rotate':
      return Number(reg.el.dataset.labRotate) || 0;
    case 'scale':
      return Number(reg.el.dataset.labScale) || 1;
    default:
      return undefined;
  }
}
