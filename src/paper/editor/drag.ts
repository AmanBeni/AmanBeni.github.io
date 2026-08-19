/**
 * Move / resize / rotate gestures.
 *
 * This is where the flow-vs-free rule (LAB-SPEC section 3) is enforced. A
 * `flow` element is NEVER given left/top/position:absolute, however it is
 * dragged - vertical movement becomes a margin on a 4px grid, horizontal
 * movement past 40% of a sibling's width reorders via CSS `order`, and
 * corner drag becomes a percentage max-width. A `free` element only ever
 * gets `left`/`top` as a percentage of its data-lab-canvas ancestor.
 */

import { LabStore, applyPropToElement, setTransformPart } from './state';
import { Registry, Selection, type Registration } from './select';

const GRID = 4; // px snap grid for flow margins
const REORDER_THRESHOLD = 0.4; // fraction of sibling width

function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface DragCtx {
  reg: Registration;
  startX: number;
  startY: number;
  startMarginTop: number;
  startMarginBottom: number;
  startMaxWidth: number;
  startXPercent: number;
  startYPercent: number;
  startRotate: number;
  startScale: number;
  canvasRect: DOMRect | null;
  mode: 'move' | 'resize' | 'rotate';
  handle: string | null;
  moved: boolean;
}

let dupeCounter = 0;

export class DragController {
  constructor(
    private store: LabStore,
    private registry: Registry,
    private selection: Selection,
  ) {}

  attach(layer: HTMLElement): void {
    layer.addEventListener('mousedown', (e) => this.onOverlayMouseDown(e));
    document.addEventListener('mousedown', (e) => this.onDocMouseDown(e), true);
  }

  private onOverlayMouseDown(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const handle = target.dataset.handle;
    const reg = this.selection.current;
    if (!handle || !reg) return;
    e.preventDefault();
    e.stopPropagation();
    this.beginDrag(reg, e, handle === 'rotate' ? 'rotate' : 'resize', handle);
  }

  /** Dragging the element itself (not a handle) moves it. */
  private onDocMouseDown(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-lab-id]');
    if (!target) return;
    const id = target.dataset.labId!;
    const reg = this.registry.byId.get(id);
    if (!reg) return;
    if (this.selection.current?.id !== id) return; // must already be selected
    if ((e.target as HTMLElement).closest('.lab-handle')) return; // handled above
    if (!document.body.classList.contains('lab-editing')) return;

    if (e.altKey && reg.kind === 'free') {
      const clone = this.duplicateFree(reg);
      if (clone) {
        e.preventDefault();
        this.beginDrag(clone, e, 'move', null);
      }
      return;
    }
    this.beginDrag(reg, e, 'move', null);
  }

  private duplicateFree(reg: Registration): Registration | null {
    dupeCounter += 1;
    const newId = `${reg.id}.copy${dupeCounter}`;
    const clonedEl = reg.el.cloneNode(true) as HTMLElement;
    clonedEl.dataset.labId = newId;
    clonedEl.classList.add('lab-duplicated');
    reg.el.parentElement?.appendChild(clonedEl);
    const newReg: Registration = { ...reg, id: newId, el: clonedEl };
    this.registry.byId.set(newId, newReg);
    this.registry.order.push(newId);
    this.store.mutate((s) => {
      const src = s.elements[reg.id] ?? {};
      s.elements[newId] = { ...src, kind: 'free' };
    });
    this.selection.select(newId);
    return newReg;
  }

  private beginDrag(reg: Registration, e: MouseEvent, mode: DragCtx['mode'], handle: string | null): void {
    const rect = reg.el.getBoundingClientRect();
    const canvasRect = reg.canvas ? reg.canvas.getBoundingClientRect() : null;
    const state = this.store.getElement(reg.id);

    const ctx: DragCtx = {
      reg,
      startX: e.clientX,
      startY: e.clientY,
      startMarginTop: Number(state.marginTop ?? 0),
      startMarginBottom: Number(state.marginBottom ?? 0),
      startMaxWidth: Number(state.maxWidth ?? 100),
      startXPercent: Number(state.x ?? (canvasRect ? ((rect.left - canvasRect.left) / canvasRect.width) * 100 : 0)),
      startYPercent: Number(state.y ?? (canvasRect ? ((rect.top - canvasRect.top) / canvasRect.height) * 100 : 0)),
      startRotate: Number(state.rotate ?? 0),
      startScale: Number(state.scale ?? 1),
      canvasRect,
      mode,
      handle,
      moved: false,
    };

    this.store.beginChange();

    const onMove = (ev: MouseEvent) => this.onDrag(ctx, ev);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (ctx.moved) this.store.commitChange();
      else this.store.commitChange(); // no-op change, still clears pending snapshot
      this.selection.reposition();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private onDrag(ctx: DragCtx, e: MouseEvent): void {
    const dx = e.clientX - ctx.startX;
    const dy = e.clientY - ctx.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ctx.moved = true;
    if (!ctx.moved) return;

    if (ctx.reg.kind === 'free') {
      this.dragFree(ctx, dx, dy);
    } else {
      this.dragFlow(ctx, dx, dy);
    }
    this.selection.reposition();
  }

  // -- free: percentage of the canvas, plus rotate/scale/z. Never pixels. --
  private dragFree(ctx: DragCtx, dx: number, dy: number): void {
    const canvas = ctx.canvasRect;
    if (!canvas) return;
    const { reg } = ctx;

    if (ctx.mode === 'rotate') {
      // Horizontal drag from the rotate handle maps linearly to degrees.
      const rotate = clamp(Math.round(ctx.startRotate + dx / 3), -30, 30);
      this.store.setElementProp(reg.id, 'rotate', rotate);
      setTransformPart(reg.el, 'rotate', rotate);
      return;
    }

    if (ctx.mode === 'resize') {
      const scaleDelta = 1 + (dx + dy) / 300;
      const scale = clamp(Number((ctx.startScale * scaleDelta).toFixed(2)), 0.2, 3);
      this.store.setElementProp(reg.id, 'scale', scale);
      setTransformPart(reg.el, 'scale', scale);
      return;
    }

    const xPercent = clamp(ctx.startXPercent + (dx / canvas.width) * 100, 0, 100);
    const yPercent = clamp(ctx.startYPercent + (dy / canvas.height) * 100, 0, 100);
    this.store.setElementProp(reg.id, 'x', Number(xPercent.toFixed(2)));
    this.store.setElementProp(reg.id, 'y', Number(yPercent.toFixed(2)));
    applyPropToElement(reg.el, 'x', xPercent, 'free');
    applyPropToElement(reg.el, 'y', yPercent, 'free');
  }

  // -- flow: margin on a 4px grid, reorder past 40% sibling width, corner -> maxWidth% --
  private dragFlow(ctx: DragCtx, dx: number, dy: number): void {
    const { reg } = ctx;

    if (ctx.mode === 'resize') {
      const parent = reg.el.parentElement;
      const parentWidth = parent ? parent.getBoundingClientRect().width : 1;
      const widthDelta = (dx / parentWidth) * 100;
      const maxWidth = clamp(Math.round(ctx.startMaxWidth + widthDelta), 20, 100);
      this.store.setElementProp(reg.id, 'maxWidth', maxWidth);
      applyPropToElement(reg.el, 'maxWidth', maxWidth, 'flow');
      return;
    }

    // Vertical drag -> margin, snapped to the 4px grid. Never a coordinate.
    const marginDelta = snap(dy, GRID);
    if (Math.abs(marginDelta) > 0) {
      const marginTop = ctx.startMarginTop + marginDelta;
      this.store.setElementProp(reg.id, 'marginTop', marginTop);
      applyPropToElement(reg.el, 'marginTop', marginTop, 'flow');
    }

    // Horizontal drag past the threshold reorders via CSS order, not position.
    const siblings = this.registry.siblingsOf(reg.id);
    if (siblings.length > 1) {
      const idx = siblings.findIndex((s) => s.id === reg.id);
      const siblingWidth = reg.el.getBoundingClientRect().width || 1;
      const ratio = dx / siblingWidth;
      let targetIdx = idx;
      if (ratio > REORDER_THRESHOLD && idx < siblings.length - 1) targetIdx = idx + 1;
      else if (ratio < -REORDER_THRESHOLD && idx > 0) targetIdx = idx - 1;
      if (targetIdx !== idx) {
        const reordered = siblings.map((s) => s.id);
        const [moved] = reordered.splice(idx, 1);
        reordered.splice(targetIdx, 0, moved);
        const parentId = reg.el.parentElement?.dataset.labId;
        if (parentId) {
          this.store.setOrder(parentId, reordered);
          applyOrder(this.registry, reordered);
        }
        // Reset drag origin so we don't re-trigger every pixel past threshold.
        ctx.startX = ctx.startX + dx;
      }
    }
  }
}

/** Applies a saved order array as CSS `order` on each sibling. */
export function applyOrder(registry: Registry, orderIds: string[]): void {
  orderIds.forEach((id, index) => {
    const reg = registry.byId.get(id);
    if (reg) reg.el.style.order = String(index);
  });
}

/** Arrow-key nudge. Flow moves margin by the grid step; free moves by percent. */
export function nudge(store: LabStore, reg: Registration, dx: number, dy: number, big: boolean): void {
  const mult = big ? 10 : 1;
  store.mutate((s) => {
    const entry = s.elements[reg.id] ?? (s.elements[reg.id] = {});
    if (reg.kind === 'free') {
      const stepX = 0.5 * mult;
      const stepY = 0.5 * mult;
      const x = clamp(Number(entry.x ?? 0) + dx * stepX, 0, 100);
      const y = clamp(Number(entry.y ?? 0) + dy * stepY, 0, 100);
      entry.x = Number(x.toFixed(2));
      entry.y = Number(y.toFixed(2));
      applyPropToElement(reg.el, 'x', entry.x, 'free');
      applyPropToElement(reg.el, 'y', entry.y, 'free');
    } else {
      const step = GRID * mult;
      const marginTop = Number(entry.marginTop ?? 0) + dy * step;
      entry.marginTop = marginTop;
      applyPropToElement(reg.el, 'marginTop', marginTop, 'flow');
    }
  });
}
