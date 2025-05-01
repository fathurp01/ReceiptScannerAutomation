import React, { useState } from "react";
import axios from "axios";

function UploadForm({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Pilih gambar terlebih dahulu");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/api/scan/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setFile(null);
      if (onSuccess) onSuccess(); // reload daftar struk
    } catch (err) {
      alert("Gagal mengunggah struk: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "2rem", padding: "1rem", border: "1px dashed #ccc" }}>
      <h3>📤 Upload Struk Belanja</h3>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginBottom: "1rem" }}
      />
      <br />
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Memproses..." : "Upload & Proses"}
      </button>

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <h4>✅ Hasil:</h4>
          <p><strong>Tanggal:</strong> {result.tanggal}</p>
          <p><strong>Toko:</strong> {result.toko}</p>
          <p><strong>Total:</strong> Rp {result.total.toLocaleString()}</p>
          <p><strong>Items:</strong></p>
          <ul>
            {result.items.map((item, idx) => (
              <li key={idx}>{item.nama} - Rp {item.harga.toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
