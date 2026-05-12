from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Crea la tabla 'bitacora' si no existe (sin restaurar datos)."

    def handle(self, *args, **options):
        existing_tables = {name.lower() for name in connection.introspection.table_names()}

        if "bitacora" in existing_tables:
            self.stdout.write(self.style.SUCCESS("OK: la tabla 'bitacora' ya existe."))
            return

        # Importar aquí para asegurar que el modelo esté cargado.
        from apps.bitacora.models import BitacoraEvento

        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(BitacoraEvento)

        self.stdout.write(self.style.SUCCESS("OK: tabla 'bitacora' creada."))
