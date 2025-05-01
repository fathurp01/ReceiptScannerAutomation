# path = "ocr_app/views.py"

from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.utils.dateparse import parse_date
from .utils import preprocess_image, ocr_image, sync_to_sheets, sync_all_to_sheets
from .models import Receipt, Item
from PIL import Image

import re
import pytesseract
import logging

logger = logging.getLogger("ocr_app")


def upload_page(request):
    return render(request, "ocr_app/upload.html")


class OCRScanView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, format=None):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "File tidak ditemukan"}, status=400)

        # Validasi: hanya image/png|jpeg, ukuran <5MB
        if not file_obj.content_type.startswith("image/"):
            return Response({"error": "Tipe file harus gambar"}, status=400)
        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "Ukuran file max 5MB"}, status=400)

        # 1) Preprocessing
        processed_img = preprocess_image(file_obj)

        # 2) OCR
        raw_text = ocr_image(processed_img)

        # 3) (Opsional) Ekstraksi sederhana contoh:
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        tanggal, total, toko = "", 0, ""

        # a) tanggal: cari pola DD/MM/YYYY
        m_date = re.search(r"\d{2}[./-]\d{2}[./-]\d{2,4}", raw_text)
        if m_date:
            tanggal = m_date.group()

        # b) total: cari “Total” + angka
        for line in lines:
            if "HARGA JUAL" in line.upper():
                m = re.search(r"(\d[\d.,]+)", line)
                if m:
                    total_str = m.group(1).replace(".", "").replace(",", "")
                    if total_str.isdigit():
                        total = int(total_str)
                        break

        # c) toko: ambil baris pertama
        toko = ""
        for line in lines:
            if "INDOMARET" in line.upper():
                toko = "INDOMARET"
                break
            if "ALFAMART" in line.upper():
                toko = "ALFAMART"
                break
            if line.strip().isupper() and len(line) > 5 and "NPWP" not in line.upper():
                toko = line
                break

        # fallback ke baris pertama jika tidak ketemu
        if not toko and lines:
            toko = lines[0]

        # d) Ekstrak daftar item: baris dengan nama & harga
        items = []
        for line in lines:
            # Ambil baris dengan angka harga di ujung
            match = re.search(r"(.*)\s+(\d[\d.,]{2,})$", line)
            if match:
                nama = match.group(1).strip()
                harga = re.sub(r"[^\d]", "", match.group(2))
                if harga.isdigit():
                    items.append({"nama": nama, "harga": int(harga)})
        items = [i for i in items if "HARGA JUAL" not in i["nama"].upper()]

        logger.debug("===== TEXT OCR HASIL PEMBACAAN =====")
        logger.debug(raw_text)
        logger.debug("===== HASIL EKSTRAKSI =====")
        logger.debug("Tanggal: %s", tanggal)
        logger.debug("Total: %s", total)
        logger.debug("Toko: %s", toko)
        logger.debug("Items: %s", items)

        # Simpan ke database
        receipt = Receipt.objects.create(toko=toko, tanggal=tanggal, total=total)
        for item in items:
            Item.objects.create(receipt=receipt, nama=item["nama"], harga=item["harga"])

        sync_to_sheets(receipt, receipt.items.all())

        # Kirim balik hasil
        return Response(
            {
                "text_raw": raw_text,
                "tanggal": tanggal,
                "toko": toko,
                "total": total,
                "items": items,
            }
        )


@api_view(["GET"])
def list_receipts(request):
    data = []
    receipts = Receipt.objects.all().order_by("-created_at")

    for r in receipts:
        items = Item.objects.filter(receipt=r)
        data.append(
            {
                "id": r.id,
                "tanggal": r.tanggal,
                "toko": r.toko,
                "total": r.total,
                "items": [
                    {"id": i.id, "nama": i.nama, "harga": i.harga} for i in items
                ],
            }
        )

    return Response(data)


@api_view(["DELETE", "PATCH"])
def receipt_detail(request, pk):
    try:
        receipt = Receipt.objects.get(pk=pk)
    except Receipt.DoesNotExist:
        return Response({"error": "Receipt tidak ditemukan"}, status=404)

    if request.method == "DELETE":
        receipt.delete()
        sync_all_to_sheets()
        return Response(
            {"message": "Berhasil dihapus"}, status=status.HTTP_204_NO_CONTENT
        )

    elif request.method == "PATCH":
        data = request.data
        if "toko" in data:
            receipt.toko = data["toko"]
        if "tanggal" in data:
            receipt.tanggal = data["tanggal"]

        # Hitung ulang total dari semua item
        receipt.total = sum(i.harga for i in receipt.items.all())
        receipt.save()
        sync_all_to_sheets()
        return Response({"message": "Berhasil diupdate"})


@api_view(["PATCH"])
def update_item(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response({"error": "Item tidak ditemukan"}, status=404)

    data = request.data
    if "nama" in data:
        item.nama = data["nama"]
    if "harga" in data:
        item.harga = data["harga"]

    item.save()

    # Hitung ulang total struk terkait
    total = sum(i.harga for i in item.receipt.items.all())
    item.receipt.total = total
    item.receipt.save()

    sync_all_to_sheets()

    return Response({"message": "Item berhasil diupdate"})


@api_view(["POST"])
def create_item(request):
    try:
        receipt_id = request.data.get("receipt")
        nama = request.data.get("nama")
        harga = request.data.get("harga")

        if not receipt_id or not nama or harga is None:
            return Response({"error": "Data tidak lengkap"}, status=400)

        receipt = Receipt.objects.get(id=receipt_id)
        item = Item.objects.create(receipt=receipt, nama=nama, harga=harga)
        sync_all_to_sheets()

        return Response(
            {
                "message": "Item berhasil ditambahkan",
                "item_id": item.id,
                "item": {"id": item.id, "nama": item.nama, "harga": item.harga},
            }
        )

    except Receipt.DoesNotExist:
        return Response({"error": "Receipt tidak ditemukan"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
