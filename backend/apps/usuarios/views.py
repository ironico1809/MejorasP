"""Vistas (endpoints) de la app `usuarios`.

Agrupa endpoints de:
- Auth JWT: login/registro/logout.
- Usuario autenticado: `/me/`.
- CRUD usuarios.
- CRUD roles.
- Asignación de roles a usuario (tabla puente `usuario_roles`).

Convención de respuestas:
- `200 OK` para lecturas/actualizaciones.
- `201 Created` para creaciones.
- `204 No Content` para eliminaciones.
- `400 Bad Request` para validaciones.
- `404 Not Found` cuando no existe entidad.

Efectos secundarios:
- Se registra bitácora con `registrar_evento()` en operaciones relevantes.
"""

from django.db import connection

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.usuarios.models import Rol, Usuario
from apps.bitacora.utils import registrar_evento
from apps.usuarios.serializers import (
    LoginSerializer,
    RegistroUsuarioSerializer,
    RolSerializer,
    UsuarioRolesReplaceSerializer,
    UsuarioRolesSerializer,
    UsuarioSerializer,
    UsuarioUpdateSerializer,
)


# --- Funciones de autenticación y gestión de usuarios/roles ---

# Genera los tokens JWT para un usuario dado

def get_tokens_for_user(usuario):
    """Genera `refresh` y `access` JWT para un usuario.

    Entrada: instancia `Usuario`.
    Devuelve: `{"refresh": "...", "access": "..."}`.
    """
    refresh = RefreshToken.for_user(usuario)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Vista para login de usuario. Valida credenciales, retorna tokens y datos del usuario.
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """Login.

        Entrada: `{"nom_usuario": "...", "password": "..."}`.
        Salida (`200`): tokens + datos del usuario.
        Errores:
        - `400` validación o contraseña incorrecta.
        - `404` si el usuario no existe.
        """
        # Valida datos de login
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['nom_usuario']
        password = serializer.validated_data['password']

        # Busca usuario y verifica contraseña
        try:
            usuario = Usuario.objects.get(nom_usuario=username)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if not usuario.check_password(password):
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(usuario)

        # Registra evento de login en la bitácora
        registrar_evento(
            request,
            accion='login',
            modulo='auth',
            entidad='Usuario',
            entidad_id=usuario.id,
            entidad_nombre=getattr(usuario, 'nom_usuario', None),
            usuario=usuario,
        )
        # Retorna tokens y datos serializados del usuario
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': UsuarioSerializer(usuario).data,
                'mensaje': 'Login correcto',
            },
            status=status.HTTP_200_OK,
        )

# Vista para registrar un nuevo usuario
class RegistroUsuarioView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """Registro de usuario.

        Entrada: `RegistroUsuarioSerializer`.
        Salida (`201`): `{mensaje, usuario}`.
        Errores (`400`): validación del serializer.
        """
        serializer = RegistroUsuarioSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()

            # Registra evento de creación de usuario
            registrar_evento(
                request,
                accion='crear',
                modulo='usuarios',
                entidad='Usuario',
                entidad_id=usuario.id,
                entidad_nombre=getattr(usuario, 'nom_usuario', None),
                detalle={'nom_usuario': usuario.nom_usuario},
                usuario=getattr(request, 'user', None) if getattr(getattr(request, 'user', None), 'is_authenticated', False) else None,
            )
            return Response(
                {
                    'mensaje': 'Usuario creado correctamente',
                    'usuario': UsuarioSerializer(usuario).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista para obtener y actualizar los datos del usuario autenticado
class UsuarioMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Devuelve el usuario autenticado (perfil).

        Salida (`200`): usuario serializado.
        """
        # Retorna los datos del usuario autenticado
        return Response(UsuarioSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Actualiza parcialmente el usuario autenticado.

        Entrada: subset de campos de `UsuarioUpdateSerializer`.
        Salida (`200`): usuario actualizado.
        Errores (`400`): validación.
        """
        # Permite actualizar parcialmente los datos del usuario autenticado
        serializer = UsuarioUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            usuario = serializer.save()

            registrar_evento(
                request,
                accion='editar',
                modulo='usuarios',
                entidad='Usuario',
                entidad_id=usuario.id,
                entidad_nombre=getattr(usuario, 'nom_usuario', None),
                usuario=request.user,
            )
            return Response(UsuarioSerializer(usuario).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista para logout (invalida el refresh token y registra evento)
class LogoutView(APIView):
    """Con JWT, el logout real se hace borrando el token en el cliente."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Logout.

        Entrada: opcional `{"refresh": "..."}` para intentar blacklist del token.
        Salida (`200`): mensaje.
        """
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        registrar_evento(
            request,
            accion='logout',
            modulo='auth',
            entidad='Usuario',
            entidad_id=getattr(request.user, 'id', None),
            usuario=request.user,
        )

        return Response({'mensaje': 'Logout correcto'}, status=status.HTTP_200_OK)

# Vista para listar todos los usuarios
class UsuarioListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista usuarios.

        Salida (`200`): array de usuarios.
        """
        usuarios = Usuario.objects.all().order_by('id')
        return Response(UsuarioSerializer(usuarios, many=True).data, status=status.HTTP_200_OK)

# Vista para obtener, actualizar o eliminar un usuario específico
class UsuarioDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_usuario_or_404(self, usuario_id):
        """Helper: retorna usuario o None."""
        try:
            return Usuario.objects.get(pk=usuario_id)
        except Usuario.DoesNotExist:
            return None

    def get(self, request, usuario_id):
        """Devuelve un usuario por id."""
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UsuarioSerializer(usuario).data, status=status.HTTP_200_OK)

    def patch(self, request, usuario_id):
        """Actualiza parcialmente un usuario."""
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UsuarioUpdateSerializer(usuario, data=request.data, partial=True)
        if serializer.is_valid():
            usuario_actualizado = serializer.save()

            registrar_evento(
                request,
                accion='editar',
                modulo='usuarios',
                entidad='Usuario',
                entidad_id=usuario_actualizado.id,
                entidad_nombre=getattr(usuario_actualizado, 'nom_usuario', None),
                usuario=request.user,
            )
            return Response(UsuarioSerializer(usuario_actualizado).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, usuario_id):
        """Elimina un usuario.

        Salida (`204`), o `404` si no existe.
        """
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        registrar_evento(
            request,
            accion='eliminar',
            modulo='usuarios',
            entidad='Usuario',
            entidad_id=usuario.id,
            entidad_nombre=getattr(usuario, 'nom_usuario', None),
            detalle={'nom_usuario': usuario.nom_usuario},
            usuario=request.user,
        )
        usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Vista para listar y crear roles
class RolListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista roles."""
        roles = Rol.objects.all().order_by('id_rol')
        return Response(RolSerializer(roles, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        """Crea un rol."""
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            rol = serializer.save()

            registrar_evento(
                request,
                accion='crear',
                modulo='roles',
                entidad='Rol',
                entidad_id=rol.id_rol,
                entidad_nombre=getattr(rol, 'nombre', None),
                detalle={'nombre': rol.nombre},
                usuario=request.user,
            )
            return Response(RolSerializer(rol).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista para obtener, actualizar o eliminar un rol específico
class RolDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_rol_or_404(self, id_rol):
        """Helper: retorna rol o None."""
        try:
            return Rol.objects.get(pk=id_rol)
        except Rol.DoesNotExist:
            return None

    def get(self, request, id_rol):
        """Devuelve rol por id."""
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(RolSerializer(rol).data, status=status.HTTP_200_OK)

    def patch(self, request, id_rol):
        """Actualiza parcialmente un rol."""
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RolSerializer(rol, data=request.data, partial=True)
        if serializer.is_valid():
            rol = serializer.save()

            registrar_evento(
                request,
                accion='editar',
                modulo='roles',
                entidad='Rol',
                entidad_id=rol.id_rol,
                entidad_nombre=getattr(rol, 'nombre', None),
                usuario=request.user,
            )
            return Response(RolSerializer(rol).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_rol):
        """Elimina un rol."""
        rol = self._get_rol_or_404(id_rol)
        if not rol:
            return Response({'detail': 'Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        registrar_evento(
            request,
            accion='eliminar',
            modulo='roles',
            entidad='Rol',
            entidad_id=rol.id_rol,
            entidad_nombre=getattr(rol, 'nombre', None),
            detalle={'nombre': rol.nombre},
            usuario=request.user,
        )
        rol.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Vista para obtener y modificar los roles de un usuario
class UsuarioRolesView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_usuario_or_404(self, usuario_id):
        """Helper: retorna usuario o None."""
        try:
            return Usuario.objects.get(pk=usuario_id)
        except Usuario.DoesNotExist:
            return None

    def get(self, request, usuario_id):
        """Lista roles asignados al usuario."""
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Consulta SQL directa para obtener roles del usuario
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.id_rol, r.nombre, r.descripcion
                FROM rol r
                INNER JOIN usuario_roles ur ON ur.rol_id = r.id_rol
                WHERE ur.usuario_id = %s
                ORDER BY r.id_rol
                """,
                [usuario.id],
            )
            rows = cursor.fetchall()

        data = [{'id_rol': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in rows]
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, usuario_id):
        """Reemplaza TODOS los roles del usuario (lista completa)."""
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UsuarioRolesReplaceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ids = list(dict.fromkeys(serializer.validated_data['roles']))
        roles = list(Rol.objects.filter(id_rol__in=ids))
        encontrados = {r.id_rol for r in roles}
        faltantes = [i for i in ids if i not in encontrados]
        if faltantes:
            return Response(
                {'detail': 'Roles no encontrados.', 'faltantes': faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reemplaza todos los roles del usuario
        with connection.cursor() as cursor:
            cursor.execute('DELETE FROM usuario_roles WHERE usuario_id = %s', [usuario.id])
            for rol in roles:
                cursor.execute(
                    'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (%s, %s)',
                    [usuario.id, rol.id_rol],
                )

        registrar_evento(
            request,
            accion='asignar_roles',
            modulo='usuarios',
            entidad='Usuario',
            entidad_id=usuario.id,
            entidad_nombre=getattr(usuario, 'nom_usuario', None),
            detalle={'modo': 'replace', 'roles': ids},
            usuario=request.user,
        )

        roles_actuales = Rol.objects.filter(id_rol__in=ids).order_by('id_rol')
        return Response(RolSerializer(roles_actuales, many=True).data, status=status.HTTP_200_OK)

    def patch(self, request, usuario_id):
        """Agrega y/o quita roles del usuario."""
        usuario = self._get_usuario_or_404(usuario_id)
        if not usuario:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UsuarioRolesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        add_ids = list(dict.fromkeys(serializer.validated_data.get('add', [])))
        remove_ids = list(dict.fromkeys(serializer.validated_data.get('remove', [])))

        add_roles = list(Rol.objects.filter(id_rol__in=add_ids))
        remove_roles = list(Rol.objects.filter(id_rol__in=remove_ids))

        add_encontrados = {r.id_rol for r in add_roles}
        remove_encontrados = {r.id_rol for r in remove_roles}
        faltantes = {
            'add': [i for i in add_ids if i not in add_encontrados],
            'remove': [i for i in remove_ids if i not in remove_encontrados],
        }
        if faltantes['add'] or faltantes['remove']:
            return Response(
                {'detail': 'Hay roles no encontrados.', 'faltantes': faltantes},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Agrega y elimina roles del usuario según corresponda
        with connection.cursor() as cursor:
            for rol in add_roles:
                cursor.execute(
                    'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
                    [usuario.id, rol.id_rol],
                )

            if remove_ids:
                cursor.execute(
                    'DELETE FROM usuario_roles WHERE usuario_id = %s AND rol_id = ANY(%s)',
                    [usuario.id, remove_ids],
                )

            cursor.execute('SELECT rol_id FROM usuario_roles WHERE usuario_id = %s', [usuario.id])
            ids_actuales = [r[0] for r in cursor.fetchall()]

        registrar_evento(
            request,
            accion='asignar_roles',
            modulo='usuarios',
            entidad='Usuario',
            entidad_id=usuario.id,
            entidad_nombre=getattr(usuario, 'nom_usuario', None),
            detalle={'modo': 'patch', 'add': add_ids, 'remove': remove_ids},
            usuario=request.user,
        )

        roles_actuales = Rol.objects.filter(id_rol__in=ids_actuales).order_by('id_rol')
        return Response(RolSerializer(roles_actuales, many=True).data, status=status.HTTP_200_OK)

# --- Fin de vistas de usuarios y roles ---
