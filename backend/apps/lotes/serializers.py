from rest_framework import serializers

from apps.galpones.models import Galpon
from apps.lotes.models import Lote


class LoteSerializer(serializers.ModelSerializer):
    # Usamos id_galpon para que coincida con tu esquema SQL
    id_galpon = serializers.PrimaryKeyRelatedField(source='galpon', queryset=Galpon.objects.all())

    class Meta:
        model = Lote
        fields = [
            'id_lote',
            'id_galpon',
            'raza_tipo',
            'fecha_ingreso',
            'fecha_salida_estimada',
            'cantidad_inicial',
            'cantidad_actual',
            'peso_inicial',
            'estado',
        ]
        read_only_fields = ['id_lote']

    def validate(self, attrs):
        cantidad_inicial = attrs.get('cantidad_inicial', getattr(self.instance, 'cantidad_inicial', None))
        cantidad_actual = attrs.get('cantidad_actual', getattr(self.instance, 'cantidad_actual', None))

        if cantidad_inicial is not None and cantidad_inicial < 0:
            raise serializers.ValidationError({'cantidad_inicial': 'Debe ser mayor o igual a 0.'})
        if cantidad_actual is not None and cantidad_actual < 0:
            raise serializers.ValidationError({'cantidad_actual': 'Debe ser mayor o igual a 0.'})
        if cantidad_inicial is not None and cantidad_actual is not None and cantidad_actual > cantidad_inicial:
            raise serializers.ValidationError({'cantidad_actual': 'No puede ser mayor que cantidad_inicial.'})

        return attrs
