// Danh sách đã thu và các thao tác trên dữ liệu.

import { $, setStatus } from "./dom.js";
import { state, save } from "./store.js";
import { today, viDate, clock } from "./util.js";

// Nút "Sửa" mở form nhập; đăng ký từ ngoài để list không phụ thuộc entry.
let onEdit = null;
export function setEditHandler(fn) { onEdit = fn; }

export function render() {
  $("dayLabel").textContent = "Ngày " + viDate(state.date);
  $("countLabel").textContent = state.items.length;
  $("sumLabel").textContent = state.items.reduce((s, it) => s + it.qty, 0);

  const stale = state.date !== today();
  $("oldBanner").hidden = !stale || state.items.length === 0;
  if (stale && state.items.length) {
    $("oldBannerText").textContent =
      `Đang giữ ${state.items.length} mã của ngày ${viDate(state.date)}.`;
  }

  const list = $("list");
  list.innerHTML = "";
  // Mới nhất lên trên, nhưng vẫn giữ chỉ số gốc để sửa/xoá đúng dòng.
  state.items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => b.it.at - a.it.at)
    .forEach(({ it, i }) => {
      const li = document.createElement("li");

      const code = document.createElement("span");
      code.className = "code";
      code.textContent = it.code;
      code.title = it.raw || it.code;

      const qty = document.createElement("span");
      qty.className = "qty";
      qty.textContent = it.qty;

      const time = document.createElement("time");
      time.textContent = clock(it.at);

      const acts = document.createElement("div");
      acts.className = "acts";
      const edit = document.createElement("button");
      edit.textContent = "Sửa";
      edit.setAttribute("aria-label", "Sửa " + it.code);
      edit.onclick = () => { if (onEdit) onEdit(it.code, i); };
      const del = document.createElement("button");
      del.textContent = "Xoá";
      del.className = "danger";
      del.setAttribute("aria-label", "Xoá " + it.code);
      del.onclick = () => removeItem(i, it.code);
      acts.append(edit, del);

      li.append(code, qty, time, acts);
      list.appendChild(li);
    });

  $("empty").hidden = state.items.length > 0;
  $("exportBtn").disabled = state.items.length === 0;
  $("shareBtn").disabled = state.items.length === 0;
}

export function removeItem(index, code) {
  if (!confirm(`Xoá ${code} khỏi danh sách?`)) return;
  state.items.splice(index, 1);
  save();
  render();
  setStatus(`Đã xoá ${code}.`);
}

export function clearAll() {
  if (!state.items.length) { startNewDay(); return; }
  if (!confirm(`Xoá toàn bộ ${state.items.length} mã đã thu? Không khôi phục được.`)) return;
  startNewDay();
  setStatus("Đã xoá sạch. Bắt đầu ngày mới.");
}

export function startNewDay() {
  state.items = [];
  state.date = today();
  save();
  render();
}
