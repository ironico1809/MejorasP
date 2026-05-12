from django.contrib import admin

from apps.temperatura.models import TemperaturaGalpon


@admin.register(TemperaturaGalpon)
class TemperaturaGalponAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'galpon',
        'temperatura',
        'estado',
        'fuente',
        'fecha_hora',
    ]

    list_filter = [
        'estado',
        'fuente',
        'galpon',
    ]

    search_fields = [
        'galpon__nombre',
        'estado',
        'fuente',
    ]

    ordering = [
        '-fecha_hora',
        '-id',
    ]