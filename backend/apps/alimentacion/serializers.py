from rest_framework import serializers

from apps.alimentacion.models import Alimentacion
from apps.lotes.models import Lote


class AlimentacionSerializer(serializers.ModelSerializer):
	# Usamos id_lote para que coincida con tu esquema SQL
	id_lote = serializers.PrimaryKeyRelatedField(source='lote', queryset=Lote.objects.all())

	class Meta:
		model = Alimentacion
		fields = [
			'id_alimentacion',
			'id_lote',
			'fecha',
			'cantidad_kg',
			'tipo_alimento',
			'observacion',
		]
		read_only_fields = ['id_alimentacion']

	def validate_cantidad_kg(self, value):
		if value is None:
			return value
		if value <= 0:
			raise serializers.ValidationError('Debe ser mayor que 0.')
		return value
