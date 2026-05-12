"""Configuración de Django para la app `usuarios`."""

from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    """`AppConfig` para registrar la app dentro de `INSTALLED_APPS`."""
    name = 'apps.usuarios'
