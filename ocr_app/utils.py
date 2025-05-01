# ocr_app/utils.py

import cv2
import numpy as np
from PIL import Image
import pytesseract
from google.oauth2 import service_account
from googleapiclient.discovery import build
from .models import Receipt, Item

# (Opsional) Jika belum masuk PATH, aktifkan baris ini:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def preprocess_image(file_obj):
    """
    Pra-pemrosesan gambar struk sebelum OCR:
    1. Baca file bytes dari InMemoryUploadedFile
    2. Decode ke format OpenCV (BGR)
    3. Konversi ke grayscale, blur, dan threshold adaptif
    4. Operasi morfologi untuk membersihkan noise
    Mengembalikan: array numpy (uint8) siap untuk OCR
    """
    # Baca bytes dan decode ke array OpenCV
    img_bytes = file_obj.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # 1. Resize besar agar teks lebih jelas (jika kecil)
    scale_percent = 200  # perbesar 2x
    width = int(img.shape[1] * scale_percent / 100)
    height = int(img.shape[0] * scale_percent / 100)
    img = cv2.resize(img, (width, height), interpolation=cv2.INTER_LINEAR)

    # 2. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Adaptive Threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 15, 10
    )

    # 4. Morphology (Open+Close) hapus noise
    kernel = np.ones((2, 2), np.uint8)
    opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)

    return closed


def ocr_image(processed_img):
    """
    Melakukan OCR pada gambar yang telah diproses.
    - processed_img: array numpy hasil preprocess_image
    Mengembalikan: teks yang terdeteksi (string)
    """
    pil_img = Image.fromarray(processed_img)
    custom_config = r"--oem 3 --psm 6"
    text = pytesseract.image_to_string(pil_img, lang="ind", config=custom_config)
    return text


def sync_to_sheets(receipt, items):
    SPREADSHEET_ID = "1pIcCTQMoYNWfu1kPjAIzdHrQ53tylW8xQ1nV9TpRsVw"  # ← Ganti dengan ID spreadsheet Anda
    SHEET_NAME = "Sheet1"

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = service_account.Credentials.from_service_account_file(
        "credentials.json", scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=creds)
    sheet = service.spreadsheets()

    values = []
    for item in items:
        values.append(
            [receipt.tanggal, receipt.toko, receipt.total, item.nama, item.harga]
        )

    body = {"values": values}

    sheet.values().append(
        spreadsheetId=SPREADSHEET_ID,
        range=f"{SHEET_NAME}!A2",
        valueInputOption="USER_ENTERED",
        insertDataOption="INSERT_ROWS",
        body=body,
    ).execute()


def sync_all_to_sheets():
    SPREADSHEET_ID = "1pIcCTQMoYNWfu1kPjAIzdHrQ53tylW8xQ1nV9TpRsVw"
    SHEET_NAME = "Sheet1"

    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = service_account.Credentials.from_service_account_file(
        "credentials.json", scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=creds)
    sheet = service.spreadsheets()

    # Kosongkan isi dari A2 ke bawah agar header (A1) tetap ada
    sheet.values().clear(
        spreadsheetId=SPREADSHEET_ID, range=f"{SHEET_NAME}!A2:Z1000"
    ).execute()

    # Ambil ulang seluruh data dari database
    values = []
    receipts = Receipt.objects.all()
    for r in receipts:
        items = Item.objects.filter(receipt=r)
        for i in items:
            values.append([r.tanggal, r.toko, r.total, i.nama, i.harga])

    if values:
        body = {"values": values}
        sheet.values().append(
            spreadsheetId=SPREADSHEET_ID,
            range=f"{SHEET_NAME}!A2",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body=body,
        ).execute()
