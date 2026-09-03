// Cài đặt tách mã từ chuỗi QR.

import { $ } from "./dom.js";
import { state, save, parseCode } from "./store.js";

export function syncSettingsUI() {
  $("delimInput").value = state.settings.delimiter;
  $("fieldInput").value = state.settings.fieldIndex;
  updatePreview();
}

export function readSettings() {
  state.settings.delimiter = $("delimInput").value;
  const n = parseInt($("fieldInput").value, 10);
  state.settings.fieldIndex = Number.isFinite(n) && n > 0 ? n : 1;
  save();
  updatePreview();
}

export function updatePreview() {
  const sample = $("testInput").value.trim();
  const box = $("preview");
  if (!sample) {
    box.className = "preview";
    box.textContent = "Dán một chuỗi QR vào ô trên để xem mã được tách ra.";
    return;
  }
  const code = parseCode(sample);
  if (code) {
    box.className = "preview";
    box.innerHTML = "Mã sản phẩm: <b></b>";
    box.querySelector("b").textContent = code;
  } else {
    box.className = "preview bad";
    box.textContent = "Không tách được. Kiểm tra lại dấu phân cách và vị trí đoạn.";
  }
}
