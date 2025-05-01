from django.db import models


class Receipt(models.Model):
    toko = models.CharField(max_length=255)
    tanggal = models.CharField(max_length=20, blank=True)
    total = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.toko} - {self.tanggal}"


class Item(models.Model):
    receipt = models.ForeignKey(Receipt, related_name="items", on_delete=models.CASCADE)
    nama = models.CharField(max_length=255)
    harga = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.nama} - {self.harga}"
