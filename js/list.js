// Danh sách đã thu và các thao tác trên dữ liệu.

import { $, setStatus } from "./dom.js";
import { state, save, groupItems, vehicleNote } from "./store.js";
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
  // Gộp theo mã sản phẩm, mới nhất lên trên.
  groupItems()
    .sort((a, b) => b.at - a.at)
    .forEach(g => list.appendChild(groupRow(g)));

  $("empty").hidden = state.items.length > 0;
  $("exportBtn").disabled = state.items.length === 0;
  $("shareBtn").disabled = state.items.length === 0;
}

function actionButtons(index, label) {
  const acts = document.createElement("div");
  acts.className = "acts";

  const edit = document.createElement("button");
  edit.textContent = "Sửa";
  edit.setAttribute("aria-label", "Sửa " + label);
  edit.onclick = () => { if (onEdit) onEdit(index); };

  const del = document.createElement("button");
  del.textContent = "Xoá";
  del.className = "danger";
  del.setAttribute("aria-label", "Xoá " + label);
  del.onclick = () => removeItem(index, label);

  acts.append(edit, del);
  return acts;
}

function groupRow(g) {
  const li = document.createElement("li");
  const single = g.vehicles.length === 1;

  const row = document.createElement("div");
  row.className = "row";

  const code = document.createElement("span");
  code.className = "code";
  code.textContent = g.code;
  code.title = g.raw || g.code;

  const qty = document.createElement("span");
  qty.className = "qty";
  qty.textContent = g.qty;

  const time = document.createElement("time");
  time.textContent = clock(g.at);

  row.append(code, qty, time);
  // Một xe thì sửa/xoá ngay trên dòng; nhiều xe thì mỗi xe có nút riêng,
  // nếu không sẽ không rõ đang sửa xe nào.
  if (single) row.append(actionButtons(g.vehicles[0].index, g.code));
  li.append(row);

  const note = vehicleNote(g);
  if (note) {
    const p = document.createElement("p");
    p.className = "veh-note";
    p.textContent = note;
    li.append(p);
  }

  if (!single) {
    const sub = document.createElement("ul");
    sub.className = "veh";
    g.vehicles.forEach(v => {
      const vli = document.createElement("li");

      const xe = document.createElement("span");
      xe.className = "xe";
      xe.textContent = v.xe || "(không có số xe)";

      const vq = document.createElement("span");
      vq.className = "qty";
      vq.textContent = v.qty;

      const vt = document.createElement("time");
      vt.textContent = clock(v.at);

      vli.append(xe, vq, vt, actionButtons(v.index, `${g.code} xe ${v.xe || "?"}`));
      sub.append(vli);
    });
    li.append(sub);
  }

  return li;
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
