from django.urls import path
from django.http import JsonResponse
from .views import (
    OCRScanView,
    upload_page,
    list_receipts,
    receipt_detail,
    update_item,
    create_item,
)


def api_root(request):
    return JsonResponse(
        {"message": "API aktif. Gunakan endpoint /api/scan/ untuk POST gambar."}
    )


urlpatterns = [
    path("", upload_page, name="upload-page"),
    path("scan/", OCRScanView.as_view(), name="ocr-scan"),
    path("receipts/", list_receipts, name="list-receipts"),
    path("receipts/<int:pk>/", receipt_detail, name="receipt-detail"),
    path("items/<int:pk>/", update_item, name="update-item"),
    path("items/", create_item, name="create-item"),
]
