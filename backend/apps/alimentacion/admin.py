from django.contrib import admin

from apps.alimentacion.models import Alimentacion


@admin.register(Alimentacion)
class AlimentacionAdmin(admin.ModelAdmin):
	list_display = ('id_alimentacion', 'lote', 'fecha', 'cantidad_kg', 'tipo_alimento')
	search_fields = ('id_alimentacion', 'lote__id_lote', 'tipo_alimento')
	list_filter = ('fecha', 'tipo_alimento')
