"""Serializers de la app `bitacora`.

La respuesta del endpoint de bitácora se alinea al esquema solicitado:
- `id`
- `usuario_id`
- `accion`
- `descripcion`
- `fecha_hora`
"""

from rest_framework import serializers

from apps.bitacora.models import BitacoraEvento


class BitacoraEventoSerializer(serializers.ModelSerializer):
    """Serializa un `BitacoraEvento` con el shape esperado por el frontend."""

    usuario_id = serializers.IntegerField(read_only=True)
    usuario_nombre = serializers.SerializerMethodField()

    def get_usuario_nombre(self, obj):
        usuario = getattr(obj, 'usuario', None)
        return getattr(usuario, 'nom_usuario', None) if usuario else None

    class Meta:
        model = BitacoraEvento
        fields = [
            'id',
            'usuario_id',
            'usuario_nombre',
            'accion',
            'descripcion',
            'fecha_hora',
        ]
