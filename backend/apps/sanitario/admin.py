from django.contrib import admin

from apps.sanitario.models import RegistroEnfermedadLote, AlertaSanitaria


@admin.register(RegistroEnfermedadLote)
class RegistroEnfermedadLoteAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'lote',
        'nombre_enfermedad',
        'aves_afectadas',
        'estado',
        'fecha_registro',
    ]

    list_filter = [
        'estado',
        'nombre_enfermedad',
        'fecha_registro',
    ]

    search_fields = [
        'nombre_enfermedad',
        'descripcion',
        'lote__id_lote',
    ]

    ordering = [
        '-fecha_registro',
    ]


@admin.register(AlertaSanitaria)
class AlertaSanitariaAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'tipo_alerta',
        'nivel',
        'titulo',
        'lote',
        'estado',
        'fecha_hora',
    ]

    list_filter = [
        'tipo_alerta',
        'nivel',
        'estado',
        'fecha_hora',
    ]

    search_fields = [
        'titulo',
        'descripcion',
        'causa',
        'lote__id_lote',
    ]

    ordering = [
        '-fecha_hora',
    ]