"""Serializers de la app `permisos`.

Incluye serializers para:
- CRUD de `Permiso`.
- Modificación de permisos asociados a un rol (payloads add/remove o replace).
"""

from rest_framework import serializers

from apps.permisos.models import Permiso


class PermisoSerializer(serializers.ModelSerializer):
    """Serializa un `Permiso`.

    Entrada:
    - POST/PUT/PATCH: `nombre`, `descripcion`.

    Salida:
    - JSON con `id_permiso`, `nombre`, `descripcion`.
    """

    class Meta:
        model = Permiso
        fields = ['id_permiso', 'nombre', 'descripcion']
        read_only_fields = ['id_permiso']


class RolPermisosSerializer(serializers.Serializer):
    """Payload para PATCH de permisos de un rol.

    - `add`: lista de ids a agregar.
    - `remove`: lista de ids a quitar.

    Devuelve: datos validados para la vista.
    """

    add = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    remove = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)

    def validate(self, attrs):
        if 'add' not in attrs and 'remove' not in attrs:
            raise serializers.ValidationError('Debes enviar "add" y/o "remove".')
        return attrs


class RolPermisosReplaceSerializer(serializers.Serializer):
    """Payload para PUT (reemplazo total) de permisos de un rol.

    - `permisos`: lista de ids_permiso final.
    """

    permisos = serializers.ListField(child=serializers.IntegerField(), required=True, allow_empty=True)
