// Điểm khởi động: gắn sự kiện và nạp dữ liệu đã lưu.

import { $, setStatus } from "./dom.js";
import { load } from "./store.js";
import {
  startCamera, stopCamera, isScanning, updateMobileGuide, setScanHandler
} from "./scanner.js";
import { onScan, openEntry, openManual, closeEntry, commit, focusQty } from "./entry.js";
import { render, clearAll, startNewDay, setEditHandler } from "./list.js";
import { exportFile, shareFile } from "./excel.js";
import { syncSettingsUI, readSettings, updatePreview } from "./settings.js";

setScanHandler(onScan);
setEditHandler(openEntry);

$("startBtn").onclick = startCamera;
$("stopBtn").onclick = () => { stopCamera(); setStatus("Camera đã tắt."); };
$("manualBtn").onclick = openManual;
$("saveBtn").onclick = () => commit("set");
$("addBtn").onclick = () => commit("add");
$("cancelBtn").onclick = closeEntry;
$("newDayBtn").onclick = () => {
  if (confirm("Xoá dữ liệu ngày cũ và bắt đầu ngày mới?")) {
    startNewDay();
    setStatus("Đã bắt đầu ngày mới.");
  }
};
$("clearBtn").onclick = clearAll;
$("exportBtn").onclick = exportFile;
$("shareBtn").onclick = shareFile;

$("qtyInput").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); commit("set"); }
});
$("manualCode").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); focusQty(); }
});

$("delimInput").addEventListener("input", readSettings);
$("fieldInput").addEventListener("input", readSettings);
$("testInput").addEventListener("input", updatePreview);

document.addEventListener("visibilitychange", () => {
  if (document.hidden && isScanning()) { stopCamera(); setStatus("Camera tạm dừng."); }
});
window.addEventListener("pagehide", () => { if (isScanning()) stopCamera(); });

// Nút gửi đi chỉ hiện trên máy hỗ trợ chia sẻ file.
if (navigator.canShare) $("shareBtn").hidden = false;

updateMobileGuide();
load();
syncSettingsUI();
render();
