from django.apps import AppConfig


class TemperaturaConfig(AppConfig):
    # Tipo de ID automático que usará Django
    default_auto_field = 'django.db.models.BigAutoField'

    # Ruta real de la app dentro del proyecto
    name = 'apps.temperatura'