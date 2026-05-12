"""Rutas (URLs) de la app `usuarios`.

Incluye endpoints de:
- Usuarios: listado/detalle.
- Roles: listado/detalle.
- Asignación roles a usuario.
- Auth JWT: login/registro/me/logout + refresh/verify.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from apps.usuarios.views import (
    LoginView,
    LogoutView,
    RegistroUsuarioView,
    RolDetailView,
    RolListCreateView,
    UsuarioMeView,
    UsuarioListView,
    UsuarioDetailView,
    UsuarioRolesView,
)

urlpatterns = [
    # Gestión de usuarios (admin/self)
    path('', UsuarioListView.as_view(), name='usuarios_list'),
    path('<int:usuario_id>/', UsuarioDetailView.as_view(), name='usuarios_detail'),

    # Roles (CU04)
    path('roles/', RolListCreateView.as_view(), name='roles_list_create'),
    path('roles/<int:id_rol>/', RolDetailView.as_view(), name='roles_detail'),
    path('<int:usuario_id>/roles/', UsuarioRolesView.as_view(), name='usuario_roles'),

    # Auth / sesión (público y autenticado)
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroUsuarioView.as_view(), name='registro_usuario'),
    path('me/', UsuarioMeView.as_view(), name='usuario_me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]