// Xuất Excel và chia sẻ file.

import * as XLSX from "xlsx";
import { $, setStatus } from "./dom.js";
import { state } from "./store.js";
import { viDate, clock } from "./util.js";

export function buildWorkbook() {
  const rows = state.items
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code, "en"))
    .map(it => ({
      "Mã sản phẩm": it.code,
      "Số lượng": it.qty,
      "Giờ quét": clock(it.at)
    }));

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["Mã sản phẩm", "Số lượng", "Giờ quét"]
  });
  ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, viDate(state.date).replace(/\//g, "-"));
  return wb;
}

export function fileName() {
  return `san-luong-${state.date}.xlsx`;
}

export function exportFile() {
  try {
    XLSX.writeFile(buildWorkbook(), fileName());
    setStatus(`Đã tạo ${fileName()}.`, "ok");
  } catch (err) {
    setStatus("Không tạo được file: " + err.message, "error");
  }
}

export async function shareFile() {
  try {
    const out = XLSX.write(buildWorkbook(), { bookType: "xlsx", type: "array" });
    const file = new File([out], fileName(), {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName() });
      setStatus("Đã gửi file.", "ok");
    } else {
      exportFile();
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;   // người dùng tự huỷ
    exportFile();
  }
}
