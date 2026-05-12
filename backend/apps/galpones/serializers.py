"""Serializers de la app `galpones`.

Responsabilidad:
- Validar payloads de creación/edición de galpones.
- Serializar instancias de `Galpon` a JSON para respuestas de API.
"""

from rest_framework import serializers

from apps.galpones.models import Galpon


class GalponSerializer(serializers.ModelSerializer):
    """Serializador principal de Galpón.

    Entrada:
    - POST/PUT/PATCH: JSON con `nombre`, `capacidad`, `descripcion`, `estado`.

    Salida:
    - Respuestas API: JSON con `id` + campos del galpón.
    """
    class Meta:
        model = Galpon
        fields = ['id', 'nombre', 'capacidad', 'descripcion', 'estado']
        read_only_fields = ['id']
