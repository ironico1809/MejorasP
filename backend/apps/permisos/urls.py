"""Rutas (URLs) de la app `permisos`."""

from django.urls import path

from apps.permisos.views import PermisoDetailView, PermisoListCreateView, RolPermisosView

urlpatterns = [
    # Permisos
    path('', PermisoListCreateView.as_view(), name='permisos_list_create'),
    path('<int:id_permiso>/', PermisoDetailView.as_view(), name='permisos_detail'),

    # Permisos por rol (tabla puente rol_permisos)
    path('roles/<int:id_rol>/permisos/', RolPermisosView.as_view(), name='roles_permisos'),
]
