from django.db import models
from django.utils import timezone


class Lote(models.Model):
	id_lote = models.AutoField(primary_key=True)
	galpon = models.ForeignKey(
		'galpones.Galpon',
		on_delete=models.PROTECT,
		db_column='id_galpon',
		related_name='lotes',
	)
	raza_tipo = models.CharField(max_length=50, blank=True, null=True)
	fecha_ingreso = models.DateField(default=timezone.localdate)
	fecha_salida_estimada = models.DateField(blank=True, null=True)
	cantidad_inicial = models.IntegerField()
	cantidad_actual = models.IntegerField()
	peso_inicial = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
	estado = models.CharField(max_length=20, default='Crianza')

	class Meta:
		db_table = 'lote'

	def __str__(self):
		return f"Lote {self.id_lote} - {self.galpon_id}"
