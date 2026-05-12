"""Modelos de la app `bitacora`.

El usuario pidió que la bitácora tenga exactamente este esquema (equivalente SQL):

        CREATE TABLE bitacora (
                id BIGSERIAL PRIMARY KEY,
                usuario_id BIGINT REFERENCES usuarios(id),
                accion VARCHAR(255) NOT NULL,
                descripcion TEXT,
                fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

Notas:
- En Django, `BIGSERIAL` se representa como `BigAutoField`.
- `DEFAULT CURRENT_TIMESTAMP` se representa con `auto_now_add=True`.
- En el modelo mantenemos el nombre de clase histórico `BitacoraEvento` para no romper
    imports internos del proyecto, pero la tabla en DB pasa a ser `bitacora`.
"""

from django.db import models


class BitacoraEvento(models.Model):
    """Registro de bitácora.

    Se ajusta para reflejar el esquema solicitado:
    - `id`: BIGSERIAL PK
    - `usuario`: FK opcional a `usuarios.Usuario` (columna `usuario_id`)
    - `accion`: string
    - `descripcion`: texto opcional
    - `fecha_hora`: timestamp de creación
    """

    id = models.BigAutoField(primary_key=True)

    usuario = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_bitacora',
        db_column='usuario_id',
    )

    accion = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bitacora'
        ordering = ['-fecha_hora', '-id']

    def __str__(self):
        return f"{self.fecha_hora} {self.accion} (usuario_id={self.usuario_id})"
