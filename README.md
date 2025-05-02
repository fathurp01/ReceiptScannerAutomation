# Receipt Scanner Automation

Sistem web berbasis Django + React untuk melakukan ekstraksi data dari gambar struk belanja menggunakan OCR dan menyimpan hasilnya ke Google Sheets secara otomatis.

## Fitur Utama

- Upload gambar struk belanja (JPG, PNG)
- Ekstraksi teks dengan OCR (Tesseract + OpenCV)
- Deteksi otomatis tanggal, toko, total, dan daftar item
- CRUD struk dan item: lihat, edit, hapus, tambah item
- Sinkronisasi otomatis ke Google Sheets
- Filter data berdasarkan tanggal dan nama toko
- Notifikasi dan log aktivitas di frontend

## Teknologi

### Backend
- Python 3.x
- Django 4.x
- Django REST Framework
- Tesseract OCR (via pytesseract)
- OpenCV
- Google Sheets API (dengan Service Account)

### Frontend
- React.js
- Axios
- Tailwind CSS (opsional)

## Instalasi Lokal

### 1. Clone Repo
```bash
git clone https://github.com/fathurp01/ReceiptScannerAutomation.git
cd receiptScannerAutomation
```

### 2. Setup Backend
```bash
cd receiptScannerAutomation
python -m venv env
source env/bin/activate  # atau env\Scripts\activate di Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Setup Frontend
```bash
cd receipt-scanner-frontend
npm install
npm start
```

Frontend akan berjalan di http://localhost:3000 dan backend di http://127.0.0.1:8000.

## Konfigurasi Google Sheets API

1. Buka Google Cloud Console
2. Buat project baru (misalnya: `Receipt Scanner Project`)
3. Aktifkan "Google Sheets API"
4. Buat Service Account
5. Unduh file credentials.json dan letakkan di folder backend
6. Salin email service account dan beri akses edit ke Google Sheet tujuan
7. Salin ID spreadsheet ke dalam fungsi sync (lihat `utils.py` → `SPREADSHEET_ID`)

## Struktur Direktori

```
receiptScannerAutomation/
├── ocr_app/                  # App utama (OCR, API, GSheet)
│   └── ...
├── receipt_scanner_backend/     # Django backend
│   └── ...
├── receipt-scanner-frontend/    # React frontend
│   ├── src/components/          # Komponen React
│   └── ...
├── credentials.json             # Google Service Account Key 
├── manage.py
├── README.md
└── .gitignore
```

## Endpoint API

| Method | Endpoint                | Deskripsi                    |
|--------|-------------------------|------------------------------|
| POST   | /api/scan/              | Upload dan OCR gambar        |
| GET    | /api/receipts/          | Ambil semua struk            |
| DELETE | /api/receipts/<id>/     | Hapus satu struk             |
| PATCH  | /api/receipts/<id>/     | Update tanggal/toko          |
| PATCH  | /api/items/<id>/        | Update item (nama/harga)     |
| POST   | /api/items/             | Tambah item ke struk         |

## Catatan Tambahan

- Total akan dihitung otomatis berdasarkan jumlah harga semua item
- Setiap perubahan data (create, delete, update) akan langsung sinkron ke Google Sheets
- Tersedia log aktivitas di bawah daftar struk
- Fitur validasi harga negatif, restore data lama, dan notifikasi berhasil telah tersedia

## Lisensi

MIT License

---

> Dibuat oleh Fathurrahman Pratama Putra, 2025  
> Untuk kebutuhan edukasi, penelitian, dan pengembangan sistem otomasi berbasis AI dan data sekunder.
