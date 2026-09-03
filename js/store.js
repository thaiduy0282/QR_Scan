// Trạng thái phiên làm việc và lưu tạm vào localStorage.

import { setStatus } from "./dom.js";
import { today } from "./util.js";

const STORE_KEY = "thu-san-luong-v1";

export const DEFAULTS = { delimiter: ",", fieldIndex: 2 };

// state được giữ nguyên tham chiếu (không gán lại) để các module khác
// import một lần là dùng được suốt.
export const state = { date: today(), items: [], settings: { ...DEFAULTS } };

export function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (_) {
    setStatus("Không lưu tạm được. Hãy xuất Excel sớm.", "error");
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.items)) {
      Object.assign(state, {
        date: saved.date || today(),
        items: saved.items,
        settings: { ...DEFAULTS, ...(saved.settings || {}) }
      });
    }
  } catch (_) { /* dữ liệu hỏng thì bỏ, bắt đầu lại */ }
}

export function parseCode(raw) {
  const text = String(raw).trim();
  const { delimiter, fieldIndex } = state.settings;
  if (!delimiter) return text;
  const parts = text.split(delimiter);
  const i = Number(fieldIndex) - 1;
  if (!(i >= 0) || i >= parts.length) return null;
  const value = parts[i].trim();
  return value || null;
}

export function findItem(code) {
  return state.items.find(it => it.code === code) || null;
}
