"""Modelos de la app `galpones`.

Un galpón representa una unidad física donde se alojan lotes.
Se relaciona con lotes vía `related_name='lotes'` (definido en el modelo de lotes).
"""

from django.db import models


class Galpon(models.Model):
	"""Entidad Galpón.

	Campos:
	- `nombre`: identificador humano del galpón (único).
	- `capacidad`: capacidad máxima (p.ej. número de aves).
	- `descripcion`: texto opcional.
	- `estado`: estado lógico (default 'activo').

	Devuelve (ORM): instancias de `Galpon`.
	"""
	id = models.BigAutoField(primary_key=True)
	nombre = models.CharField(max_length=100, unique=True)
	capacidad = models.IntegerField()
	descripcion = models.TextField(blank=True, null=True)
	estado = models.CharField(max_length=20, default='activo')

	class Meta:
		db_table = 'galpones'

	def __str__(self):
		return self.nombre
