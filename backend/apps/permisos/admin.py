"""Admin de la app `permisos`."""

from django.contrib import admin

from apps.permisos.models import Permiso


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    """Presentación del modelo `Permiso` en Django Admin."""
    list_display = ('id_permiso', 'nombre')
    search_fields = ('nombre',)
