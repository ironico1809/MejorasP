from django.db import models
from django.db.models.functions import Now


class RegistroEnfermedadLote(models.Model):
    """
    Modelo de apoyo para registrar enfermedades detectadas en un lote.

    Este modelo sirve como base para el CU17, porque el caso de uso dice
    que las alertas sanitarias se generan tomando en cuenta las aves
    afectadas registradas en CU15.

    En palabras simples:
    aquí guardamos qué enfermedad tiene un lote y cuántas aves están afectadas.
    """

    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('En observacion', 'En observación'),
        ('Controlado', 'Controlado'),
        ('Finalizado', 'Finalizado'),
    ]

    id = models.BigAutoField(primary_key=True)

    # Lote afectado por la enfermedad.
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.PROTECT,
        db_column='id_lote',
        related_name='registros_enfermedad'
    )

    # Nombre de la enfermedad o problema sanitario.
    nombre_enfermedad = models.CharField(max_length=150)

    # Cantidad de aves afectadas dentro del lote.
    aves_afectadas = models.PositiveIntegerField()

    # Descripción adicional del problema.
    descripcion = models.TextField(blank=True, null=True)

    # Estado del registro de enfermedad.
    estado = models.CharField(
        max_length=30,
        choices=ESTADO_CHOICES,
        default='Activo'
    )

    # Fecha y hora en la que se registra la enfermedad.
    fecha_registro = models.DateTimeField(auto_now_add=True, db_default=Now())

    # Empresa para mantener compatibilidad con la estructura SaaS del proyecto.
    empresa = models.ForeignKey(
        'empresas.Empresa',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        default=1,
        db_column='empresa_id',
        related_name='registros_enfermedad',
    )

    class Meta:
        db_table = 'registro_enfermedad_lote'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"{self.nombre_enfermedad} - Lote {self.lote_id}"


class AlertaSanitaria(models.Model):
    """
    Modelo para guardar alertas sanitarias generadas automáticamente.

    Este modelo representa el CU17.

    La alerta puede generarse por:
    - Más del 5% de aves afectadas por enfermedad.
    - Aumento anormal de mortandad.
    - Bajo stock de medicamentos o vacunas.
    """

    TIPO_ALERTA_CHOICES = [
        ('Enfermedad', 'Enfermedad'),
        ('Mortandad', 'Mortandad'),
        ('Stock', 'Stock'),
    ]

    NIVEL_CHOICES = [
        ('Media', 'Media'),
        ('Alta', 'Alta'),
        ('Critica', 'Crítica'),
    ]

    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Atendida', 'Atendida'),
        ('Resuelta', 'Resuelta'),
    ]

    id = models.BigAutoField(primary_key=True)

    # Lote relacionado con la alerta.
    # Puede ser null cuando la alerta sea por bajo stock general de medicamento.
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='id_lote',
        related_name='alertas_sanitarias'
    )

    # Registro de enfermedad que originó la alerta.
    registro_enfermedad = models.ForeignKey(
        RegistroEnfermedadLote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_generadas'
    )

    # Insumo relacionado, por ejemplo medicamento con bajo stock.
    insumo = models.ForeignKey(
        'insumos.Insumo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_sanitarias'
    )

    # Tipo de alerta: Enfermedad, Mortandad o Stock.
    tipo_alerta = models.CharField(
        max_length=30,
        choices=TIPO_ALERTA_CHOICES
    )

    # Nivel de gravedad.
    nivel = models.CharField(
        max_length=20,
        choices=NIVEL_CHOICES,
        default='Alta'
    )

    # Título corto de la alerta.
    titulo = models.CharField(max_length=200)

    # Descripción detallada.
    descripcion = models.TextField()

    # Causa sanitaria detectada.
    causa = models.CharField(max_length=200, blank=True, null=True)

    # Cantidad de aves afectadas, si corresponde.
    cantidad_afectada = models.PositiveIntegerField(null=True, blank=True)

    # Porcentaje de aves afectadas, si corresponde.
    porcentaje_afectado = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Valor detectado que disparó la alerta.
    # Ejemplo: 6.5% de aves afectadas o 25 bajas.
    valor_detectado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Umbral usado para comparar.
    # Ejemplo: 5% o 20%.
    umbral = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    # Estado de atención de la alerta.
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='Pendiente'
    )

    # Fecha y hora en que se generó la alerta.
    fecha_hora = models.DateTimeField(auto_now_add=True, db_default=Now())

    # Usuario que atendió o resolvió la alerta.
    atendida_por = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_sanitarias_atendidas'
    )

    # Fecha en que se marcó como atendida o resuelta.
    fecha_atencion = models.DateTimeField(null=True, blank=True)

    # Empresa para mantener compatibilidad con SaaS.
    empresa = models.ForeignKey(
        'empresas.Empresa',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        default=1,
        db_column='empresa_id',
        related_name='alertas_sanitarias',
    )

    class Meta:
        db_table = 'alertas_sanitarias'
        ordering = ['-fecha_hora']

    def __str__(self):
        return f"{self.tipo_alerta} - {self.nivel} - {self.estado}"