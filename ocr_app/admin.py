from django.contrib import admin
from .models import Receipt, Item


class ItemInline(admin.TabularInline):
    model = Item
    extra = 0


class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("toko", "tanggal", "total", "created_at")
    inlines = [ItemInline]


admin.site.register(Receipt, ReceiptAdmin)
