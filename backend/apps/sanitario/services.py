from datetime import timedelta
from decimal import Decimal

from django.db.models import F, Sum
from django.utils import timezone

from apps.insumos.models import Insumo
from apps.mortandad.models import RegistroMortalidad
from apps.sanitario.models import AlertaSanitaria, RegistroEnfermedadLote


UMBRAL_ENFERMEDAD_PORCENTAJE = Decimal('5.00')
UMBRAL_AUMENTO_MORTANDAD = Decimal('20.00')


def calcular_porcentaje(cantidad, total):
    """
    Calcula porcentaje.

    Ejemplo:
    cantidad = 600
    total = 10000

    Resultado:
    6.00
    """

    if not total or total <= 0:
        return Decimal('0.00')

    resultado = (Decimal(cantidad) / Decimal(total)) * Decimal('100')
    return resultado.quantize(Decimal('0.01'))


def crear_alerta_si_no_existe(
    *,
    lote=None,
    registro_enfermedad=None,
    insumo=None,
    tipo_alerta,
    nivel,
    titulo,
    descripcion,
    causa=None,
    cantidad_afectada=None,
    porcentaje_afectado=None,
    valor_detectado=None,
    umbral=None,
    empresa_id=1,
):
    """
    Crea una alerta sanitaria solo si no existe una alerta pendiente similar.

    Esto evita que el sistema cree muchas alertas repetidas por el mismo problema.
    """

    alerta_existente = AlertaSanitaria.objects.filter(
        lote=lote,
        insumo=insumo,
        tipo_alerta=tipo_alerta,
        causa=causa,
        estado='Pendiente'
    ).first()

    if alerta_existente:
        return alerta_existente, False

    alerta = AlertaSanitaria.objects.create(
        lote=lote,
        registro_enfermedad=registro_enfermedad,
        insumo=insumo,
        tipo_alerta=tipo_alerta,
        nivel=nivel,
        titulo=titulo,
        descripcion=descripcion,
        causa=causa,
        cantidad_afectada=cantidad_afectada,
        porcentaje_afectado=porcentaje_afectado,
        valor_detectado=valor_detectado,
        umbral=umbral,
        empresa_id=empresa_id,
    )

    return alerta, True


def evaluar_alerta_por_enfermedad(registro):
    """
    Evalúa si un registro de enfermedad debe generar alerta.

    Regla del CU17:
    Si las aves afectadas superan el 5% de la población actual del lote,
    se genera alerta sanitaria.
    """

    lote = registro.lote
    cantidad_actual = lote.cantidad_actual or 0

    porcentaje = calcular_porcentaje(
        registro.aves_afectadas,
        cantidad_actual
    )

    alertas = []

    if porcentaje > UMBRAL_ENFERMEDAD_PORCENTAJE:
        alerta, creada = crear_alerta_si_no_existe(
            lote=lote,
            registro_enfermedad=registro,
            tipo_alerta='Enfermedad',
            nivel='Alta',
            titulo='Riesgo sanitario alto por enfermedad',
            descripcion=(
                f"El lote {lote.id_lote} tiene {registro.aves_afectadas} aves "
                f"afectadas por {registro.nombre_enfermedad}. "
                f"Esto representa el {porcentaje}% de la población actual, "
                f"superando el umbral permitido del 5%."
            ),
            causa=registro.nombre_enfermedad,
            cantidad_afectada=registro.aves_afectadas,
            porcentaje_afectado=porcentaje,
            valor_detectado=porcentaje,
            umbral=UMBRAL_ENFERMEDAD_PORCENTAJE,
            empresa_id=registro.empresa_id or 1,
        )

        alertas.append(alerta)

    return alertas


def evaluar_alerta_por_mortandad_post_enfermedad(registro):
    """
    Evalúa si la mortandad aumentó más del 20% después de una enfermedad.

    Regla del CU17:
    Si la mortandad diaria aumenta 20% sobre el promedio diario
    en las 24 horas posteriores a una enfermedad, se genera alerta.
    """

    lote = registro.lote

    fecha_inicio = registro.fecha_registro
    fecha_fin = fecha_inicio + timedelta(hours=24)

    ahora = timezone.now()

    if fecha_fin > ahora:
        fecha_fin = ahora

    # Total de bajas desde que se registró la enfermedad hasta ahora.
    total_24h = (
        RegistroMortalidad.objects
        .filter(
            lote=lote,
            fecha_hora__gte=fecha_inicio,
            fecha_hora__lte=fecha_fin
        )
        .aggregate(total=Sum('cantidad'))
        .get('total') or 0
    )

    # Promedio de mortandad de los 7 días anteriores.
    fecha_promedio_inicio = fecha_inicio - timedelta(days=7)

    total_anterior = (
        RegistroMortalidad.objects
        .filter(
            lote=lote,
            fecha_hora__gte=fecha_promedio_inicio,
            fecha_hora__lt=fecha_inicio
        )
        .aggregate(total=Sum('cantidad'))
        .get('total') or 0
    )

    promedio_diario = Decimal(total_anterior) / Decimal('7')

    alertas = []

    # Si no hay promedio anterior, no podemos calcular aumento real.
    if promedio_diario <= 0:
        return alertas

    aumento = ((Decimal(total_24h) - promedio_diario) / promedio_diario) * Decimal('100')
    aumento = aumento.quantize(Decimal('0.01'))

    if aumento >= UMBRAL_AUMENTO_MORTANDAD:
        alerta, creada = crear_alerta_si_no_existe(
            lote=lote,
            registro_enfermedad=registro,
            tipo_alerta='Mortandad',
            nivel='Critica',
            titulo='Complicación post-diagnóstico',
            descripcion=(
                f"El lote {lote.id_lote} presenta un aumento de mortandad del "
                f"{aumento}% después del registro de enfermedad "
                f"{registro.nombre_enfermedad}. "
                f"El aumento supera el umbral permitido del 20%."
            ),
            causa=f"Mortandad posterior a {registro.nombre_enfermedad}",
            cantidad_afectada=int(total_24h),
            porcentaje_afectado=aumento,
            valor_detectado=aumento,
            umbral=UMBRAL_AUMENTO_MORTANDAD,
            empresa_id=registro.empresa_id or 1,
        )

        alertas.append(alerta)

    return alertas


def evaluar_alertas_por_stock_medicamentos(empresa_id=1):
    """
    Evalúa si existen medicamentos o vacunas con stock bajo.

    Se consideran críticos:
    - Medicamentos
    - Vacunas

    Si stock_actual <= stock_minimo, se genera alerta sanitaria.
    """

    insumos_criticos = Insumo.objects.filter(
        tipo__in=['Medicamento', 'Vacuna'],
        stock_actual__lte=F('stock_minimo')
    )

    if empresa_id:
        insumos_criticos = insumos_criticos.filter(empresa_id=empresa_id)

    alertas = []

    for insumo in insumos_criticos:
        alerta, creada = crear_alerta_si_no_existe(
            insumo=insumo,
            tipo_alerta='Stock',
            nivel='Alta',
            titulo='Bajo stock de medicamento crítico',
            descripcion=(
                f"El insumo sanitario {insumo.nombre} tiene stock bajo. "
                f"Stock actual: {insumo.stock_actual} {insumo.unidad_medida}. "
                f"Stock mínimo: {insumo.stock_minimo} {insumo.unidad_medida}."
            ),
            causa='Bajo stock de medicamento crítico',
            valor_detectado=insumo.stock_actual,
            umbral=insumo.stock_minimo,
            empresa_id=insumo.empresa_id or empresa_id or 1,
        )

        alertas.append(alerta)

    return alertas


def evaluar_riesgo_sanitario_lote(lote):
    """
    Evalúa todas las enfermedades activas de un lote.

    Esta función sirve para revisar nuevamente el riesgo sanitario
    cuando el usuario lo solicite desde el frontend.
    """

    registros = RegistroEnfermedadLote.objects.filter(
        lote=lote,
        estado__in=['Activo', 'En observacion']
    )

    alertas = []

    for registro in registros:
        alertas += evaluar_alerta_por_enfermedad(registro)
        alertas += evaluar_alerta_por_mortandad_post_enfermedad(registro)

    return alertas


def evaluar_riesgo_sanitario_general(empresa_id=1):
    """
    Evalúa riesgos sanitarios de forma general.

    Revisa:
    - Enfermedades activas.
    - Mortandad posterior a enfermedades.
    - Stock bajo de medicamentos y vacunas.
    """

    registros = RegistroEnfermedadLote.objects.filter(
        estado__in=['Activo', 'En observacion']
    )

    if empresa_id:
        registros = registros.filter(empresa_id=empresa_id)

    alertas = []

    for registro in registros:
        alertas += evaluar_alerta_por_enfermedad(registro)
        alertas += evaluar_alerta_por_mortandad_post_enfermedad(registro)

    alertas += evaluar_alertas_por_stock_medicamentos(empresa_id=empresa_id)

    return alertas