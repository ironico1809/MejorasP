from rest_framework import serializers

from apps.temperatura.models import TemperaturaGalpon
from apps.galpones.models import Galpon


class TemperaturaGalponSerializer(serializers.ModelSerializer):
    """
    Serializer para convertir los registros de temperatura a JSON.

    También permite registrar una temperatura manualmente desde el frontend.
    """

    # Usamos id_galpon para mantener el mismo estilo del proyecto.
    id_galpon = serializers.PrimaryKeyRelatedField(
        source='galpon',
        queryset=Galpon.objects.all()
    )

    # Nombre del galpón, solo para mostrar en el frontend.
    galpon_nombre = serializers.CharField(
        source='galpon.nombre',
        read_only=True
    )

    class Meta:
        model = TemperaturaGalpon
        fields = [
            'id',
            'id_galpon',
            'galpon_nombre',
            'temperatura',
            'estado',
            'fuente',
            'fecha_hora',
        ]
        read_only_fields = [
            'id',
            'galpon_nombre',
            'estado',
            'fuente',
            'fecha_hora',
        ]

    def validate_temperatura(self, value):
        """
        Valida que la temperatura tenga un rango razonable.

        No permitimos valores absurdos como -100 o 200.
        """
        if value < 0:
            raise serializers.ValidationError('La temperatura no puede ser menor a 0°C.')
        if value > 60:
            raise serializers.ValidationError('La temperatura no puede ser mayor a 60°C.')
        return value