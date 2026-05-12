"""Admin de la app `bitacora`.

Configura cómo se ven y se filtran los eventos en el panel /admin.
"""

from django.contrib import admin

from apps.bitacora.models import BitacoraEvento


@admin.register(BitacoraEvento)
class BitacoraEventoAdmin(admin.ModelAdmin):
    """Presentación de eventos de bitácora en Django Admin."""
    list_display = ('id', 'fecha_hora', 'usuario_id', 'accion')
    search_fields = ('accion', 'descripcion')
    list_filter = ('accion', 'fecha_hora')
