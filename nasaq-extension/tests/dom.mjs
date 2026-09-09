import { readFileSync } from 'node:fs';
import vm from 'node:vm';
// A small DOM double for behavioral tests; not a substitute for visual browser QA.
class Element {
  constructor(tag = 'option', cls = '', text = '') {
    this.tagName = tag; this.className = cls; this.children = []; this.listeners = {}; this.attributes = {};
    this._text = text; this.value = ''; this.disabled = false; this.checked = false;
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(' '); }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  querySelector(selector) { return this.all().find((node) => selector.startsWith('.') ? node.className.split(' ').includes(selector.slice(1)) : node.tagName === selector); }
  all() { return this.children.flatMap((node) => [node, ...node.all()]); }
  fire(type) { if (this.disabled) throw new Error('Cannot interact with disabled control'); return this.listeners[type]?.({ target: this }); }
}
export const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
export const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
export async function panel(request, initialSession = { ok: true, base: 'http://localhost:3000', token: 'fake', role: 'TEACHER' }) {
  const body = new Element('body');
  const context = vm.createContext({ URL, URLSearchParams, AbortSignal, console,
    document: { body, createElement: (tag) => new Element(tag) },
    Option: class extends Element { constructor(text, value) { super('option', '', text); this.value = value; } },
    chrome: { runtime: { sendMessage: (message, callback) => callback({ ...initialSession }) } },
  });
  context.window = { addEventListener: () => {} };
  vm.runInContext(readFileSync(new URL('../core.js', import.meta.url), 'utf8'), context);
  context.NasaqPrep.request = request;
  vm.runInContext(readFileSync(new URL('../content.js', import.meta.url), 'utf8'), context);
  const find = (selector) => body.querySelector(selector);
  const textButton = (text) => body.all().find((n) => n.tagName === 'button' && n.textContent.includes(text));
  find('.nq-fab').fire('click'); await settle();
  return { body, find, textButton, context, initialSession };
}
export const slot = (preparation = null) => ({ lectureId: 'l1', slot: 1, subject: {
  subjectId: 's1', name: 'الرياضيات', gradeLevel: { _id: 'g1', name: 'الأول' } }, class: { name: 'أ' }, preparation });
export const week = (periods = [slot()]) => ({ days: [{ dayOfWeek: 'sunday', date: '2026-09-06', slots: periods }] });
export const ok = (data) => ({ ok: true, data });
export const curriculum = (path) => path.startsWith('/curriculum/units?') ? ok([{ _id: 'u1', name: 'الوحدة الأولى' }]) :
  ok([{ _id: 'lesson1', name: 'الجمع' }]);
