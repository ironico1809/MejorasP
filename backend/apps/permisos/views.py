"""Vistas (endpoints) de la app `permisos`.

Endpoints:
- `GET/POST /permisos/` -> listar/crear permisos.
- `GET/PUT/PATCH/DELETE /permisos/<id>/` -> CRUD sobre un permiso.
- `GET/PUT/PATCH /permisos/roles/<id_rol>/permisos/` -> ver/modificar permisos de un rol.

Notas:
- Varias operaciones usan SQL directo sobre tablas puente (`rol_permisos`).
- Todas requieren autenticación (IsAuthenticated).
"""

from django.db import connection

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.permisos.models import Permiso
from apps.permisos.serializers import PermisoSerializer, RolPermisosReplaceSerializer, RolPermisosSerializer
from apps.usuarios.models import Rol
from apps.bitacora.utils import registrar_evento


class PermisoListCreateView(APIView):
    """Lista y crea permisos.

    Endpoints (con /permisos/ incluido en core/urls.py):
      - GET  /permisos/
      - POST /permisos/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve lista de permisos.

        Salida: `200 OK` con array de permisos serializados.
        """
        permisos = Permiso.objects.all().order_by('nombre')
        return Response(PermisoSerializer(permisos, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        """Crea un permiso.

        Entrada: JSON validado por `PermisoSerializer`.
        Salida: `201 Created` con permiso serializado, o `400` con errores.
        Registra evento en bitácora.
        """
        serializer = PermisoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permiso = serializer.save()

        registrar_evento(
            request,
            accion='crear',
            modulo='permisos',
            entidad='Permiso',
            entidad_id=permiso.id_permiso,
            entidad_nombre=permiso.nombre,
            detalle={'nombre': permiso.nombre},
            usuario=request.user,
        )
        return Response(PermisoSerializer(permiso).data, status=status.HTTP_201_CREATED)


class PermisoDetailView(APIView):
    """Obtiene, actualiza o elimina un permiso.

    Endpoints:
      - GET    /permisos/<id_permiso>/
      - PUT    /permisos/<id_permiso>/
      - PATCH  /permisos/<id_permiso>/
      - DELETE /permisos/<id_permiso>/
    """

    permission_classes = [IsAuthenticated]

    def _get_permiso_or_404(self, id_permiso):
        """Helper: retorna el permiso o None si no existe."""
        try:
            return Permiso.objects.get(pk=id_permiso)
        except Permiso.DoesNotExist:
            return None

    def get(self, request, id_permiso):
        """Devuelve `200` con el permiso o `404` si no existe."""
        permiso = self._get_permiso_or_404(id_permiso)
        if not permiso:
            return Response({'detail': 'Permiso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PermisoSerializer(permiso).data, status=status.HTTP_200_OK)

    def put(self, request, id_permiso):
        """Actualiza completamente un permiso (PUT)."""
        permiso = self._get_permiso_or_404(id_permiso)
        if not permiso:
            return Response({'detail': 'Permiso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PermisoSerializer(permiso, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permiso = serializer.save()

        registrar_evento(
            request,
            accion='editar',
            modulo='permisos',
            entidad='Permiso',
            entidad_id=permiso.id_permiso,
            entidad_nombre=permiso.nombre,
            usuario=request.user,
        )
        return Response(PermisoSerializer(permiso).data, status=status.HTTP_200_OK)

    def patch(self, request, id_permiso):
        """Actualiza parcialmente un permiso (PATCH)."""
        permiso = self._get_permiso_or_404(id_permiso)
        if not permiso:
            return Response({'detail': 'Permiso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PermisoSerializer(permiso, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        permiso = serializer.save()

        registrar_evento(
            request,
            accion='editar',
            modulo='permisos',
            entidad='Permiso',
            entidad_id=permiso.id_permiso,
            entidad_nombre=permiso.nombre,
            usuario=request.user,
        )
        return Response(PermisoSerializer(permiso).data, status=status.HTTP_200_OK)

    def delete(self, request, id_permiso):
        """Elimina un permiso.

        Salida: `204 No Content` o `404`.
        """
        permiso = self._get_permiso_or_404(id_permiso)
        if not permiso:
            return Response({'detail': 'Permiso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        registrar_evento(
            request,
            accion='eliminar',
            modulo='permisos',
            entidad='Permiso',
            entidad_id=permiso.id_permiso,
            entidad_nombre=permiso.nombre,
            detalle={'nombre': permiso.nombre},
            usuario=request.user,
        )

        permiso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RolPermisosView(APIView):
    """Gestiona permisos de un rol.

    Endpoints:
            - GET   /permisos/roles/<id_rol>/permisos/
            - PATCH /permisos/roles/<id_rol>/permisos/
            - PUT   /permisos/roles/<id_rol>/permisos/
    """

    permission_classes = [IsAuthenticated]

    def _get_rol_or_404(self, id_rol):
        """Helper: retorna el rol o None si no existe."""
        try:
            return Rol.objects.get(pk=id_rol)
        except Rol.DoesNotExist:
            return None

    def get(self, request, id_rol):
        """Lista permisos actuales del rol.

        Salida (`200`): array con `{id_permiso, nombre, descripcion}`.
        """
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.id_permiso, p.nombre, p.descripcion
                FROM permisos p
                INNER JOIN rol_permisos rp ON rp.permiso_id = p.id_permiso
                WHERE rp.rol_id = %s
                ORDER BY p.nombre
                """,
                [rol.id_rol],
            )
            rows = cursor.fetchall()

        data = [
            {'id_permiso': r[0], 'nombre': r[1], 'descripcion': r[2]}
            for r in rows
        ]
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, id_rol):
        """Reemplaza TODOS los permisos del rol.

        Entrada: `{"permisos": [1,2,3]}`.
        Salida: `200 OK` con permisos actuales del rol.
        """
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RolPermisosReplaceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ids = list(dict.fromkeys(serializer.validated_data['permisos']))
        permisos = list(Permiso.objects.filter(id_permiso__in=ids))

        encontrados = {p.id_permiso for p in permisos}
        faltantes = [i for i in ids if i not in encontrados]
        if faltantes:
            return Response(
                {'detail': 'Permisos no encontrados.', 'faltantes': faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            cursor.execute('DELETE FROM rol_permisos WHERE rol_id = %s', [rol.id_rol])

            for permiso in permisos:
                cursor.execute(
                    'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (%s, %s)',
                    [rol.id_rol, permiso.id_permiso],
                )

        registrar_evento(
            request,
            accion='asignar_permisos',
            modulo='roles',
            entidad='Rol',
            entidad_id=rol.id_rol,
            entidad_nombre=rol.nombre,
            detalle={'modo': 'replace', 'permisos': ids},
            usuario=request.user,
        )

        # Devolver lista actual
        permisos_actuales = Permiso.objects.filter(id_permiso__in=ids).order_by('nombre')
        return Response(PermisoSerializer(permisos_actuales, many=True).data, status=status.HTTP_200_OK)

    def patch(self, request, id_rol):
        """Agrega y/o quita permisos del rol.

        Entrada: `{"add": [...], "remove": [...]}` (al menos uno).
        Salida: `200 OK` con permisos actuales del rol.
        """
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RolPermisosSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        add_ids = list(dict.fromkeys(serializer.validated_data.get('add', [])))
        remove_ids = list(dict.fromkeys(serializer.validated_data.get('remove', [])))

        ids_a_validar = list(dict.fromkeys(add_ids + remove_ids))
        permisos = list(Permiso.objects.filter(id_permiso__in=ids_a_validar))
        encontrados = {p.id_permiso for p in permisos}
        faltantes = [i for i in ids_a_validar if i not in encontrados]
        if faltantes:
            return Response(
                {'detail': 'Hay permisos no encontrados.', 'faltantes': faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with connection.cursor() as cursor:
            for permiso_id in add_ids:
                cursor.execute(
                    'INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
                    [rol.id_rol, permiso_id],
                )

            if remove_ids:
                cursor.execute(
                    'DELETE FROM rol_permisos WHERE rol_id = %s AND permiso_id = ANY(%s)',
                    [rol.id_rol, remove_ids],
                )

        registrar_evento(
            request,
            accion='asignar_permisos',
            modulo='roles',
            entidad='Rol',
            entidad_id=rol.id_rol,
            entidad_nombre=rol.nombre,
            detalle={'modo': 'patch', 'add': add_ids, 'remove': remove_ids},
            usuario=request.user,
        )

        # Devolver lista actual
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.id_permiso
                FROM permisos p
                INNER JOIN rol_permisos rp ON rp.permiso_id = p.id_permiso
                WHERE rp.rol_id = %s
                """,
                [rol.id_rol],
            )
            ids_actuales = [r[0] for r in cursor.fetchall()]

        permisos_actuales = Permiso.objects.filter(id_permiso__in=ids_actuales).order_by('nombre')
        return Response(PermisoSerializer(permisos_actuales, many=True).data, status=status.HTTP_200_OK)
