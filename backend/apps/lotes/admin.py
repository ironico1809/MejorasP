"""Admin de la app `lotes`.

Configura cómo se visualiza el modelo `Lote` en el panel /admin.
"""

from django.contrib import admin

from apps.lotes.models import Lote


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
	"""Presentación del modelo `Lote` en Django Admin."""
	list_display = ('id_lote', 'galpon', 'cantidad_inicial', 'cantidad_actual', 'estado', 'fecha_ingreso')
	search_fields = ('id_lote', 'galpon__nombre')
	list_filter = ('estado', 'fecha_ingreso')

