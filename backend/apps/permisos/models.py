"""Modelos de la app `permisos`."""

from django.db import models


class Permiso(models.Model):
    """Entidad Permiso.

    Campos:
    - `nombre`: string único, identificador del permiso.
    - `descripcion`: texto opcional para UI/admin.

    Devuelve (ORM): instancias de `Permiso`.
    """
    id_permiso = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'permisos'

    def __str__(self):
        return self.nombre
