import React, { useEffect, useState } from "react";
import axios from "axios";
import FilterBar from "./FilterBar";

function ReceiptList() {
  const [receipts, setReceipts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ toko: "", tanggal: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ toko: "", tanggal: "", total: 0 });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemData, setEditItemData] = useState({ nama: "", harga: 0 });
  const [originalItemData, setOriginalItemData] = useState({});
  const [logMessages, setLogMessages] = useState([]);
  const [newItemData, setNewItemData] = useState({ nama: "", harga: "", receiptId: null });
  const [addingItemTo, setAddingItemTo] = useState(null); // id receipt yang sedang ditambah item





  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = () => {
    axios
      .get("http://127.0.0.1:8000/api/receipts/")
      .then((res) => {
        setReceipts(res.data);
        setFiltered(res.data);
      })
      .catch((err) => console.error("Error fetching receipts:", err));
  };

  useEffect(() => {
    let data = receipts;

    if (filters.toko) {
      data = data.filter((r) =>
        r.toko.toLowerCase().includes(filters.toko.toLowerCase())
      );
    }

    if (filters.tanggal) {
      data = data.filter((r) => r.tanggal.includes(filters.tanggal));
    }

    setFiltered(data);
  }, [filters, receipts]);

  const handleDelete = (id) => {
    if (!window.confirm("Hapus struk ini?")) return;

    axios
      .delete(`http://127.0.0.1:8000/api/receipts/${id}/`)
      .then(() => fetchReceipts())
      .catch((err) => alert("Gagal menghapus: " + err));
  };

  const handleEdit = (r) => {
    setEditingId(r.id);
    setEditData({
      toko: r.toko,
      tanggal: r.tanggal,
      total: r.total,
    });
  };

  const handleSave = async (id) => {
    const total = Number(editData.total);
    if (isNaN(total) || total < 0) {
      alert("Total struk tidak boleh kosong atau negatif");
      return;
    }
  
    try {
        await axios.patch(`http://127.0.0.1:8000/api/receipts/${id}/`, {
          toko: editData.toko,
          tanggal: editData.tanggal,
        });
        setEditingId(null);
        addLog(`✅ Struk #${id} diperbarui`);
        fetchReceipts();
      } catch (err) {
        alert("Gagal update: " + err.message);
      }
  };
  

  const handleAddItem = async () => {
    const { nama, harga, receiptId } = newItemData;
    const hargaInt = parseInt(harga);
    if (!nama || isNaN(hargaInt) || hargaInt < 0) {
      alert("Nama item dan harga harus valid");
      return;
    }
  
    try {
      await axios.post("http://127.0.0.1:8000/api/items/", {
        receipt: receiptId,
        nama,
        harga: hargaInt,
      });
      addLog(`➕ Item baru ditambahkan ke struk #${receiptId}`);
      setAddingItemTo(null);
      setNewItemData({ nama: "", harga: "", receiptId: null });
      fetchReceipts();
    } catch (err) {
      alert("Gagal menambahkan item: " + err.message);
    }
  };
  

  const handleItemEdit = (item) => {
    setEditingItemId(item.id);
    setEditItemData({ nama: item.nama, harga: item.harga });
    setOriginalItemData({ nama: item.nama, harga: item.harga }); // simpan salinan
  };
  
  const handleItemSave = async (itemId) => {
    try {
      if (editItemData.harga < 0) {
        alert("Harga tidak boleh negatif");
        return;
      }
      if (!itemId) {
        alert("Item belum memiliki ID, tidak bisa disimpan.");
        return;
      }      
      setEditingItemId(null);
      addLog(`✅ Item #${itemId} berhasil diupdate`);
      fetchReceipts();
    } catch (err) {
      alert("Gagal update item: " + err.message);
    }
  };

  const addLog = (msg) => {
    const now = new Date().toLocaleTimeString();
    setLogMessages((prev) => [...prev.slice(-20), `[${now}] ${msg}`]);
  };
  
  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📄 Daftar Struk Belanja</h2>
      <FilterBar filters={filters} setFilters={setFilters} />

      {filtered.length === 0 && <p>Data tidak ditemukan.</p>}
      {filtered.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            margin: "1rem 0",
            padding: "1rem",
          }}
        >
          {editingId === r.id ? (
            <div>
              <label>
                Tanggal:{" "}
                <input
                  type="text"
                  value={editData.tanggal}
                  onChange={(e) =>
                    setEditData({ ...editData, tanggal: e.target.value })
                  }
                />
              </label>
              <br />
              <label>
                Toko:{" "}
                <input
                  type="text"
                  value={editData.toko}
                  onChange={(e) =>
                    setEditData({ ...editData, toko: e.target.value })
                  }
                />
              </label>
              {/* <br />
              <label>
                Total:{" "}
                <input
                  type="number"
                  value={editData.total}
                  onChange={(e) =>
                    setEditData({ ...editData, total: e.target.value })
                  }
                />
              </label> */}
              <br />
              <button onClick={() => handleSave(r.id)}>💾 Simpan</button>
              <button onClick={() => setEditingId(null)} style={{ marginLeft: "1rem" }}>
                ❌ Batal
              </button>
            </div>
          ) : (
            <>
              <div><strong>Tanggal:</strong> {r.tanggal}</div>
              <div><strong>Toko:</strong> {r.toko}</div>
              <div><strong>Total:</strong> Rp {r.total.toLocaleString()}</div>

              <details style={{ marginTop: "0.5rem" }}>
                <summary>Lihat Daftar Item</summary>
                <ul style={{ marginTop: "0.5rem" }}>
                {r.items.map((item, idx) => (
                    <li key={item.id}>
                        {editingItemId === item.id ? (
                        <>
                            <input
                            value={editItemData.nama}
                            onChange={(e) => setEditItemData({ ...editItemData, nama: e.target.value })}
                            style={{ marginRight: "0.5rem" }}
                            />
                            <input
                            type="number"
                            value={editItemData.harga}
                            onChange={(e) => setEditItemData({ ...editItemData, harga: e.target.value })}
                            style={{ width: "100px", marginRight: "0.5rem" }}
                            />
                            <button onClick={() => handleItemSave(item.id)}>Simpan</button>
                            <button
                                onClick={() => {
                                    setEditItemData({ ...originalItemData });
                                    setEditingItemId(null);
                                    addLog(`⛔ Edit item #${item.id} dibatalkan`);
                                }}
                                >
                                Batal
                            </button>


                        </>
                        ) : (
                        <>
                            {item.nama} - Rp {item.harga.toLocaleString()}
                            <button
                            onClick={() => handleItemEdit(item)}
                            style={{
                                marginLeft: "1rem",
                                fontSize: "0.8rem",
                                padding: "0.2rem 0.5rem",
                                background: "#ddd",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            >
                            Edit
                            </button>
                        </>
                        )}
                    </li>
                    ))}

                {addingItemTo === r.id ? (
                <li>
                    <input
                    type="text"
                    placeholder="Nama item"
                    value={newItemData.nama}
                    onChange={(e) =>
                        setNewItemData({ ...newItemData, nama: e.target.value })
                    }
                    style={{ marginRight: "0.5rem" }}
                    />
                    <input
                    type="number"
                    placeholder="Harga"
                    value={newItemData.harga}
                    onChange={(e) =>
                        setNewItemData({ ...newItemData, harga: e.target.value })
                    }
                    style={{ width: "100px", marginRight: "0.5rem" }}
                    />
                    <button onClick={handleAddItem}>Tambah</button>
                    <button onClick={() => setAddingItemTo(null)} style={{ marginLeft: "0.5rem" }}>
                    Batal
                    </button>
                </li>
                ) : (
                <li>
                    <button
                    onClick={() => {
                        setAddingItemTo(r.id);
                        setNewItemData({ nama: "", harga: "", receiptId: r.id });
                    }}
                    style={{
                        marginTop: "0.5rem",
                        background: "#0088cc",
                        color: "white",
                        padding: "0.2rem 0.7rem",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                    >
                    + Tambah Item
                    </button>
                </li>
                )}

                </ul>
              </details>

              <button onClick={() => handleEdit(r)} style={{ marginTop: "0.5rem" }}>
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                style={{
                  marginLeft: "1rem",
                  background: "#f33",
                  color: "white",
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Hapus
              </button>
            </>
          )}
        </div>
      ))}
      <div style={{ marginTop: "3rem", fontSize: "0.85rem", color: "#555" }}>
        <h4>📝 Log Aktivitas</h4>
        <ul style={{ maxHeight: "200px", overflowY: "auto", paddingLeft: "1rem" }}>
            {logMessages.map((log, idx) => (
            <li key={idx}>{log}</li>
            ))}
        </ul>
        </div>

    </div>
  );
}

export default ReceiptList;
