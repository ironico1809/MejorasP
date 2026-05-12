"""Admin de la app `galpones`.

Configura cómo se visualiza el modelo `Galpon` en el panel /admin.
"""

from django.contrib import admin

from apps.galpones.models import Galpon


@admin.register(Galpon)
class GalponAdmin(admin.ModelAdmin):
	"""Presentación del modelo `Galpon` en Django Admin."""
	list_display = ('id', 'nombre', 'capacidad', 'estado')
	search_fields = ('nombre',)

