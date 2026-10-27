import { bus } from './events';
import { loadTouchLayout, saveTouchLayout, clearTouchLayout } from './state';
import type { Settings, TouchLayout } from './types';

export type ActionName = 'interact' | 'throw' | 'dodge';

class InputManager {
  moveX = 0;
  moveY = 0;
  crouch = false;
  sprint = false;
  enabled = true;
  editing = false;
  private keys = new Set<string>();
  private joystickX = 0;
  private joystickY = 0;
  private joystickPointer: number | null = null;
  private joystickZone: HTMLElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private actions: ActionName[] = [];
  private touchRoot: HTMLElement | null = null;
  private actionsRoot: HTMLElement | null = null;
  private buttons = new Map<string, HTMLButtonElement>();
  private layout: Record<string, TouchLayout> = {};
  private drag:
    | {
        pointerId: number;
        button: HTMLButtonElement;
        action: string;
        offsetX: number;
        offsetY: number;
      }
    | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.touchRoot = document.getElementById('touch-controls');
    this.actionsRoot = document.getElementById('touch-actions');
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickKnob = document.getElementById('joystick-knob');
    this.layout = loadTouchLayout();
    if (this.actionsRoot) {
      this.actionsRoot.querySelectorAll<HTMLButtonElement>('.touch-btn').forEach((button) => {
        const action = button.dataset.action;
        if (!action) return;
        this.buttons.set(action, button);
        this.bindButton(action, button);
      });
    }
    this.bindJoystick();
    this.bindKeyboard();
    this.applyLayout();
    this.bindLayoutToolbar();
  }

  private bindKeyboard(): void {
    const gameKeys = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowLeft',
      'ArrowDown',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
      'ControlLeft',
      'ControlRight',
      'Space',
      'KeyE',
      'KeyF',
      'Escape',
    ]);
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.code === 'Escape') {
          if (!event.repeat) bus.emit('ui:pause');
          return;
        }
        if (gameKeys.has(event.code) && this.enabled && !this.editing) event.preventDefault();
        if (event.repeat) return;
        this.keys.add(event.code);
        if (!this.enabled || this.editing) return;
        if (event.code === 'ControlLeft' || event.code === 'ControlRight' || event.code === 'KeyC') {
          this.crouch = !this.crouch;
        }
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.sprint = true;
        if (event.code === 'Space') this.queue('dodge');
        if (event.code === 'KeyE') this.queue('interact');
        if (event.code === 'KeyF') this.queue('throw');
      },
      { passive: false },
    );
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.sprint = false;
    });
    window.addEventListener('blur', () => this.reset());
  }

  private bindJoystick(): void {
    if (!this.joystickZone || !this.joystickBase || !this.joystickKnob) return;
    const zone = this.joystickZone;
    const base = this.joystickBase;
    const knob = this.joystickKnob;
    const update = (event: PointerEvent) => {
      if (this.joystickPointer !== event.pointerId) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const radius = rect.width * 0.34;
      const length = Math.hypot(dx, dy);
      if (length > radius && length > 0) {
        dx = (dx / length) * radius;
        dy = (dy / length) * radius;
      }
      this.joystickX = dx / radius;
      this.joystickY = dy / radius;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };
    const end = (event: PointerEvent) => {
      if (this.joystickPointer !== event.pointerId) return;
      this.joystickPointer = null;
      this.joystickX = 0;
      this.joystickY = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };
    zone.addEventListener('pointerdown', (event) => {
      if (!this.enabled || this.editing) return;
      event.preventDefault();
      this.joystickPointer = event.pointerId;
      zone.setPointerCapture(event.pointerId);
      update(event);
    });
    zone.addEventListener('pointermove', (event) => {
      if (!this.enabled || this.editing) return;
      event.preventDefault();
      update(event);
    });
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private bindButton(action: string, button: HTMLButtonElement): void {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.editing) {
        this.startDrag(event, action, button);
        return;
      }
      if (!this.enabled) return;
      if (action === 'crouch') {
        this.crouch = !this.crouch;
        button.classList.toggle('toggled', this.crouch);
      } else if (action === 'sprint') {
        this.sprint = true;
        button.classList.add('is-active');
        button.setPointerCapture(event.pointerId);
      } else if (action === 'interact' || action === 'throw' || action === 'dodge') {
        this.queue(action);
        button.classList.add('is-active');
        window.setTimeout(() => button.classList.remove('is-active'), 120);
      }
    });
    button.addEventListener('pointerup', (event) => {
      if (action === 'sprint') {
        this.sprint = false;
        button.classList.remove('is-active');
      }
      if (this.editing) this.endDrag(event.pointerId);
    });
    button.addEventListener('pointercancel', (event) => {
      if (action === 'sprint') this.sprint = false;
      button.classList.remove('is-active');
      if (this.editing) this.endDrag(event.pointerId);
    });
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private startDrag(event: PointerEvent, action: string, button: HTMLButtonElement): void {
    if (!this.actionsRoot) return;
    const buttonRect = button.getBoundingClientRect();
    this.drag = {
      pointerId: event.pointerId,
      button,
      action,
      offsetX: event.clientX - buttonRect.left,
      offsetY: event.clientY - buttonRect.top,
    };
    button.setPointerCapture(event.pointerId);
    button.style.transition = 'none';
    window.addEventListener('pointermove', this.onDragMove);
    window.addEventListener('pointerup', this.onDragEnd);
    window.addEventListener('pointercancel', this.onDragEnd);
  }

  private onDragMove = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId || !this.actionsRoot) return;
    event.preventDefault();
    const rect = this.actionsRoot.getBoundingClientRect();
    const buttonRect = this.drag.button.getBoundingClientRect();
    const maxX = rect.width - buttonRect.width;
    const maxY = rect.height - buttonRect.height;
    const x = Math.max(0, Math.min(maxX, event.clientX - rect.left - this.drag.offsetX));
    const y = Math.max(0, Math.min(maxY, event.clientY - rect.top - this.drag.offsetY));
    this.drag.button.style.left = `${x}px`;
    this.drag.button.style.top = `${y}px`;
    this.drag.button.style.right = 'auto';
    this.drag.button.style.bottom = 'auto';
  };

  private onDragEnd = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.endDrag(event.pointerId);
  };

  private endDrag(pointerId: number): void {
    if (!this.drag || this.drag.pointerId !== pointerId) return;
    const { action, button } = this.drag;
    if (this.actionsRoot) {
      const rect = this.actionsRoot.getBoundingClientRect();
      const btnRect = button.getBoundingClientRect();
      this.layout[action] = {
        x: (btnRect.left - rect.left) / rect.width,
        y: (btnRect.top - rect.top) / rect.height,
      };
    }
    button.style.transition = '';
    this.drag = null;
    window.removeEventListener('pointermove', this.onDragMove);
    window.removeEventListener('pointerup', this.onDragEnd);
    window.removeEventListener('pointercancel', this.onDragEnd);
  }

  private bindLayoutToolbar(): void {
    const editBtn = document.getElementById('btn-edit-layout');
    const toolbar = document.getElementById('layout-toolbar');
    const saveBtn = document.getElementById('btn-layout-save');
    const resetBtn = document.getElementById('btn-layout-reset');
    editBtn?.addEventListener('click', () => {
      if (this.editing) {
        saveTouchLayout(this.layout);
        this.setEditing(false);
        bus.emit('ui:toast', '按键位置已保存');
      } else {
        this.setEditing(true);
      }
    });
    saveBtn?.addEventListener('click', () => {
      saveTouchLayout(this.layout);
      this.setEditing(false);
      bus.emit('ui:toast', '按键位置已保存');
    });
    resetBtn?.addEventListener('click', () => {
      clearTouchLayout();
      this.layout = {};
      this.buttons.forEach((button) => {
        button.style.left = '';
        button.style.top = '';
        button.style.right = '';
        button.style.bottom = '';
      });
      this.setEditing(false);
      bus.emit('ui:toast', '按键位置已重置');
    });
    if (toolbar) toolbar.classList.toggle('hidden', true);
  }

  setEditing(editing: boolean): void {
    this.editing = editing;
    this.enabled = !editing;
    document.getElementById('touch-controls')?.classList.toggle('layout-editing', editing);
    document.getElementById('layout-toolbar')?.classList.toggle('hidden', !editing);
    const editBtn = document.getElementById('btn-edit-layout');
    if (editBtn) editBtn.textContent = editing ? '完成调整' : '调整按键';
    if (!editing) this.applyLayout();
  }

  applyLayout(): void {
    this.buttons.forEach((button, action) => {
      const pos = this.layout[action];
      if (!pos) return;
      button.style.left = `${pos.x * 100}%`;
      button.style.top = `${pos.y * 100}%`;
      button.style.right = 'auto';
      button.style.bottom = 'auto';
    });
  }

  applySettings(settings: Settings): void {
    document.documentElement.style.setProperty('--touch-scale', String(settings.buttonScale));
  }

  showTouchControls(show: boolean): void {
    this.touchRoot = this.touchRoot ?? document.getElementById('touch-controls');
    this.touchRoot?.classList.toggle('hidden', !show);
  }

  queue(action: ActionName): void {
    if (!this.enabled || this.editing) return;
    this.actions.push(action);
  }

  consume(action: ActionName): boolean {
    const index = this.actions.indexOf(action);
    if (index === -1) return false;
    this.actions.splice(index, 1);
    return true;
  }

  clearActions(): void {
    this.actions.length = 0;
  }

  reset(): void {
    this.keys.clear();
    this.joystickX = 0;
    this.joystickY = 0;
    this.joystickPointer = null;
    this.sprint = false;
    this.moveX = 0;
    this.moveY = 0;
    this.actions.length = 0;
    if (this.joystickKnob) this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    this.buttons.forEach((button) => button.classList.remove('is-active'));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.reset();
  }

  update(): void {
    if (!this.enabled || this.editing) {
      this.moveX = 0;
      this.moveY = 0;
      return;
    }
    let x = this.joystickX;
    let y = this.joystickY;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.moveX = x;
    this.moveY = y;
  }
}

export const input = new InputManager();
