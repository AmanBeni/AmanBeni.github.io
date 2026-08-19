/**
 * State model for the Lab editor.
 *
 * Holds the single source of truth for what Aman has changed: theme tokens,
 * per-element overrides, and sibling order. Everything the DOM shows in edit
 * mode is a projection of this state - drag/panel code never mutates styles
 * directly without going through the store, so undo/redo and autosave stay
 * consistent.
 *
 * Only changed values are ever written out (see Paper/LAB-SPEC.md section 7).
 * An element Aman never touched has no entry.
 */

export type LabKind = 'flow' | 'free';

export interface ElementState {
  kind?: LabKind;
  hidden?: boolean;
  variantActive?: string;
  [prop: string]: unknown;
}

export type ThemeState = Record<string, string>;

export interface LabState {
  version: number;
  savedAt: string;
  note: string;
  theme: ThemeState;
  elements: Record<string, ElementState>;
  order: Record<string, string[]>;
}

const STORAGE_KEY = 'lab-state-v1';
const MAX_HISTORY = 60;

export function emptyState(): LabState {
  return { version: 1, savedAt: '', note: '', theme: {}, elements: {}, order: {} };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Known ink/theme tokens a `color` prop value may reference by name. */
const COLOR_TOKENS = new Set(['ink', 'ink-soft', 'accent']);
const FONT_TOKENS = new Set(['display', 'body', 'mono']);
const SHADOW_PRESETS = new Set(['none', 'soft', 'lifted', 'deep']);

/**
 * Applies one property value to a live DOM element. Shared by initial state
 * hydration, drag updates, and the properties panel so there is exactly one
 * place that knows how each vocabulary entry becomes CSS (section 4).
 */
export function applyPropToElement(el: HTMLElement, prop: string, value: unknown, kind: LabKind): void {
  switch (prop) {
    case 'fontSize':
      el.style.fontSize = `${value}px`;
      break;
    case 'lineHeight':
      el.style.lineHeight = String(value);
      break;
    case 'letterSpacing':
      el.style.letterSpacing = `${value}em`;
      break;
    case 'fontWeight':
      el.style.fontWeight = String(value);
      break;
    case 'font':
      el.style.fontFamily = FONT_TOKENS.has(String(value))
        ? `var(--font-${value})`
        : String(value);
      break;
    case 'color':
      el.style.color = COLOR_TOKENS.has(String(value)) ? `var(--${value})` : String(value);
      break;
    case 'align':
      el.style.textAlign = String(value);
      break;
    case 'maxWidth':
      el.style.maxWidth = `${value}%`;
      break;
    case 'marginTop':
      el.style.marginTop = `${value}px`;
      break;
    case 'marginBottom':
      el.style.marginBottom = `${value}px`;
      break;
    case 'paddingTop':
      el.style.paddingTop = `${value}px`;
      break;
    case 'paddingBottom':
      el.style.paddingBottom = `${value}px`;
      break;
    case 'gap':
      el.style.gap = `${value}px`;
      break;
    case 'background': {
      const v = String(value);
      if (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('var(')) {
        el.style.backgroundColor = v;
      } else {
        el.style.backgroundImage = `url(${assetSrc(v)})`;
      }
      break;
    }
    case 'x':
      if (kind === 'free') el.style.left = `${value}%`;
      break;
    case 'y':
      if (kind === 'free') el.style.top = `${value}%`;
      break;
    case 'rotate':
    case 'scale':
      applyTransform(el);
      break;
    case 'z':
      if (kind === 'free') el.style.zIndex = String(value);
      break;
    case 'opacity':
      el.style.opacity = String(value);
      break;
    case 'shadow':
      el.style.boxShadow = SHADOW_PRESETS.has(String(value)) && value !== 'none'
        ? `var(--shadow-${value})`
        : 'none';
      break;
    case 'src':
      if (el instanceof HTMLImageElement) el.src = assetSrc(String(value));
      break;
    default:
      // Unrecognised prop: ignore for DOM purposes but it stays in state.
      break;
  }
}

let manifestCache: Array<{ id: string; src: string }> | null = null;
export function setAssetManifest(list: Array<{ id: string; src: string }>): void {
  manifestCache = list;
}
function assetSrc(idOrUrl: string): string {
  if (idOrUrl.startsWith('/') || idOrUrl.startsWith('http') || idOrUrl.startsWith('data:')) {
    return idOrUrl;
  }
  const found = manifestCache?.find((m) => m.id === idOrUrl);
  return found ? found.src : idOrUrl;
}

/** rotate + scale live in one transform, applied together whichever changed. */
function applyTransform(el: HTMLElement): void {
  const rotate = el.dataset.labRotate ?? '0';
  const scale = el.dataset.labScale ?? '1';
  el.style.transform = `rotate(${rotate}deg) scale(${scale})`;
}

export function setTransformPart(el: HTMLElement, part: 'rotate' | 'scale', value: number): void {
  if (part === 'rotate') el.dataset.labRotate = String(value);
  else el.dataset.labScale = String(value);
  applyTransform(el);
}

type Listener = () => void;

export class LabStore {
  state: LabState = emptyState();
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private listeners = new Set<Listener>();
  private pendingSnapshot: string | null = null;

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.autosaveLocal();
    for (const fn of this.listeners) fn();
  }

  async load(): Promise<void> {
    let loaded: LabState | null = null;
    try {
      const res = await fetch('/__lab/state');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && Object.keys(data).length) {
          loaded = { ...emptyState(), ...data };
        }
      }
    } catch {
      // dev server not reachable, fall through to localStorage
    }
    if (!loaded) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          loaded = JSON.parse(raw);
        } catch {
          loaded = null;
        }
      }
    }
    this.state = loaded ?? emptyState();
    this.notify();
  }

  private autosaveLocal(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // storage full or unavailable, non-fatal
    }
  }

  /** Call once before a batch of related mutations (e.g. drag start). */
  beginChange(): void {
    if (this.pendingSnapshot === null) {
      this.pendingSnapshot = JSON.stringify(this.state);
    }
  }

  /** Call once after a batch of related mutations (e.g. drag end). */
  commitChange(): void {
    if (this.pendingSnapshot !== null) {
      this.undoStack.push(this.pendingSnapshot);
      if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
      this.redoStack = [];
      this.pendingSnapshot = null;
    }
    this.notify();
  }

  /** Convenience for single, atomic mutations. */
  mutate(fn: (state: LabState) => void): void {
    this.beginChange();
    fn(this.state);
    this.commitChange();
  }

  undo(): void {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return;
    this.redoStack.push(JSON.stringify(this.state));
    this.state = JSON.parse(snapshot);
    this.notify();
  }

  redo(): void {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return;
    this.undoStack.push(JSON.stringify(this.state));
    this.state = JSON.parse(snapshot);
    this.notify();
  }

  getElement(id: string): ElementState {
    return this.state.elements[id] ?? {};
  }

  setElementProp(id: string, prop: string, value: unknown): void {
    if (!this.state.elements[id]) this.state.elements[id] = {};
    this.state.elements[id][prop] = value;
  }

  setKind(id: string, kind: LabKind): void {
    if (!this.state.elements[id]) this.state.elements[id] = {};
    this.state.elements[id].kind = kind;
  }

  toggleHidden(id: string): void {
    if (!this.state.elements[id]) this.state.elements[id] = {};
    this.state.elements[id].hidden = !this.state.elements[id].hidden;
  }

  setVariantActive(groupId: string, activeId: string): void {
    if (!this.state.elements[groupId]) this.state.elements[groupId] = {};
    this.state.elements[groupId].variantActive = activeId;
  }

  setOrder(containerId: string, order: string[]): void {
    this.state.order[containerId] = order;
  }

  setTheme(varName: string, value: string): void {
    this.state.theme[varName] = value;
  }

  resetElement(id: string): void {
    delete this.state.elements[id];
  }

  resetAll(): void {
    this.state = emptyState();
  }

  async saveToServer(note: string): Promise<{ ok: boolean; path?: string; error?: string }> {
    const payload: LabState = clone(this.state);
    payload.version = 1;
    payload.savedAt = new Date().toISOString();
    payload.note = note ?? this.state.note ?? '';
    try {
      const res = await fetch('/__lab/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        this.state = payload;
        this.notify();
        return { ok: true, path: data.path };
      }
      return { ok: false, error: data.error || 'save failed' };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
