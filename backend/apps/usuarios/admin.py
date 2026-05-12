"""Admin de la app `usuarios`.

Permite gestionar `Usuario` y `Rol` desde Django Admin.
Esto es útil mientras se desarrolla/valida el frontend.
"""

from django.contrib import admin

from apps.usuarios.models import Rol, Usuario


# Permite gestionar usuarios y permisos desde /admin mientras construyes el frontend.
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
	"""Configuración de listado/búsqueda para `Usuario` en admin."""
	list_display = ('id', 'nom_usuario', 'email', 'tipo_usuario', 'estado')
	search_fields = ('nom_usuario', 'email')


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
	"""Configuración de listado/búsqueda para `Rol` en admin."""
	list_display = ('id_rol', 'nombre')
	search_fields = ('nombre',)


