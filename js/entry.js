// Form nhập số lượng cho mã vừa quét (hoặc nhập tay).

import { $, bringIntoView, setStatus } from "./dom.js";
import { state, save, parseCode, findItem } from "./store.js";
import { today } from "./util.js";
import { buzz, primeAudio } from "./audio.js";
import { isScanning, stopCamera } from "./scanner.js";
import { render } from "./list.js";

let editIndex = -1;      // >= 0 khi đang sửa một dòng có sẵn

let manualMode = false;

let lastReject = { text: "", at: 0 };

export function onScan(text) {
  if (!$("entry").hidden) return;   // đang nhập dở, bỏ qua

  const code = parseCode(text);
  if (!code) {
    // The loop decodes every frame, so an unreadable code would otherwise
    // re-buzz 30 times a second while it sits in view.
    const now = Date.now();
    if (lastReject.text === text && now - lastReject.at < 2000) return;
    lastReject = { text, at: now };
    setStatus("Không tách được mã từ chuỗi vừa quét. Kiểm tra phần cài đặt.", "error");
    buzz(false);
    return;
  }
  lastReject = { text: "", at: 0 };

  // Tắt camera ngay: khung ngắm thu lại nên ô nhập nằm gọn trong màn hình,
  // và người dùng chủ động bật lại khi muốn quét tiếp.
  stopCamera();
  buzz(true);
  openEntry(code, -1, text);
}

export function openEntry(code, index, raw) {
  editIndex = index;
  manualMode = false;

  $("manualCode").hidden = true;
  $("entryCode").hidden = false;
  $("entryCode").textContent = code;
  $("entryCode").dataset.raw = raw || "";
  $("entryTitle").textContent = index >= 0 ? "Sửa dòng đã nhập" : "Mã vừa quét";

  const existing = index >= 0 ? state.items[index] : findItem(code);
  if (existing) {
    $("entryDupe").hidden = false;
    $("entryDupe").textContent =
      `Mã này đã nhập ${existing.qty} lúc ${clock(existing.at)}.`;
    $("qtyInput").value = existing.qty;
    $("addBtn").hidden = index >= 0;   // sửa thì không cần cộng dồn
  } else {
    $("entryDupe").hidden = true;
    $("qtyInput").value = "";
    $("addBtn").hidden = true;
  }

  $("entry").hidden = false;
  setStatus("");
  focusQty();
}

export function openManual() {
  primeAudio();
  stopCamera();
  editIndex = -1;
  manualMode = true;

  $("entryTitle").textContent = "Nhập tay";
  $("entryCode").hidden = true;
  $("entryDupe").hidden = true;
  $("addBtn").hidden = true;
  $("manualCode").hidden = false;
  $("manualCode").value = "";
  $("qtyInput").value = "";
  $("entry").hidden = false;
  bringIntoView($("entry"));
  setTimeout(() => $("manualCode").focus(), 140);
}

export function focusQty() {
  const input = $("qtyInput");
  bringIntoView($("entry"));
  // Chờ một nhịp để bàn phím số bật đúng trên iOS, và để cuộn xong trước
  // khi bàn phím đẩy layout lên.
  setTimeout(() => { input.focus(); input.select(); }, 140);
}

export function closeEntry() {
  $("entry").hidden = true;
  editIndex = -1;
  manualMode = false;
  $("qtyInput").value = "";
  if (!isScanning()) {
    setStatus("Bấm bật camera để quét tiếp.");
    // Đưa nút bật camera trở lại tầm mắt, khỏi phải cuộn lên.
    bringIntoView($("camControls"));
  }
}

export function commit(mode) {
  const qty = parseInt($("qtyInput").value, 10);
  if (!Number.isFinite(qty) || qty < 0) {
    setStatus("Số lượng chưa hợp lệ.", "error");
    focusQty();
    return;
  }

  const code = manualMode
    ? $("manualCode").value.trim().toUpperCase()
    : $("entryCode").textContent;

  if (!code) {
    setStatus("Chưa có mã sản phẩm.", "error");
    $("manualCode").focus();
    return;
  }

  if (editIndex >= 0) {
    const it = state.items[editIndex];
    it.code = code;
    it.qty = qty;
    it.at = Date.now();
  } else {
    const existing = findItem(code);
    if (existing) {
      existing.qty = mode === "add" ? existing.qty + qty : qty;
      existing.at = Date.now();
      if ($("entryCode").dataset.raw) existing.raw = $("entryCode").dataset.raw;
    } else {
      state.items.push({
        code,
        qty,
        at: Date.now(),
        raw: $("entryCode").dataset.raw || ""
      });
    }
  }

  // Phiên đang mở thuộc về ngày hôm nay kể từ lần ghi đầu tiên.
  if (state.items.length === 1) state.date = today();

  save();
  render();
  closeEntry();
  setStatus(`Đã lưu ${code} = ${qty}.`, "ok");
}
