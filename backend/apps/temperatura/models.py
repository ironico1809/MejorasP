from django.db import models


class TemperaturaGalpon(models.Model):
    """
    Modelo para guardar las temperaturas registradas por galpón.

    Este modelo representa el sensor virtual del sistema.
    Como no tenemos un sensor físico, el backend simulará temperaturas
    y las guardará en esta tabla.
    """

    id = models.BigAutoField(primary_key=True)

    # Relación con el galpón.
    # Cada temperatura pertenece a un galpón específico.
    galpon = models.ForeignKey(
        'galpones.Galpon',
        on_delete=models.CASCADE,
        related_name='temperaturas',
        db_column='galpon_id'
    )

    # Temperatura registrada en grados Celsius.
    temperatura = models.DecimalField(
        max_digits=5,
        decimal_places=2
    )

    # Estado calculado automáticamente:
    # FRIO, NORMAL o CALOR.
    estado = models.CharField(
        max_length=20
    )

    # Fuente del dato.
    # SIMULADO = generado por el sistema.
    # MANUAL = ingresado por un usuario.
    fuente = models.CharField(
        max_length=20,
        default='SIMULADO'
    )

    # Fecha y hora exacta del registro.
    fecha_hora = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = 'temperatura_galpon'
        ordering = ['-fecha_hora', '-id']

    def __str__(self):
        return f"{self.galpon.nombre} - {self.temperatura}°C - {self.estado}"