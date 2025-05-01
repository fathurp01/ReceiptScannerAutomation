import React from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function ExportExcelButton() {
  const exportData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/receipts/");
      const receipts = res.data;

      const rows = [];
      receipts.forEach((r) => {
        r.items.forEach((item) => {
          rows.push({
            Tanggal: r.tanggal,
            Toko: r.toko,
            Total: r.total,
            "Nama Item": item.nama,
            Harga: item.harga,
          });
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Struk Belanja");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, `struk-belanja-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert("Gagal mengekspor data: " + err.message);
    }
  };

  return (
    <button
      onClick={exportData}
      style={{
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        padding: "0.5rem 1rem",
        borderRadius: "5px",
        cursor: "pointer",
        marginBottom: "1rem"
      }}
    >
      ⬇️ Download Excel
    </button>
  );
}

export default ExportExcelButton;
