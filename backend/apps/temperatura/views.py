import random

from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.galpones.models import Galpon
from apps.temperatura.models import TemperaturaGalpon
from apps.temperatura.serializers import TemperaturaGalponSerializer
from apps.bitacora.utils import registrar_evento


def calcular_estado_temperatura(temperatura):
    """
    Calcula el estado de la temperatura.

    Regla del sistema:
    - Menor a 24°C: FRIO
    - Entre 24°C y 34°C: NORMAL
    - Mayor a 34°C: CALOR
    """

    temperatura = float(temperatura)

    if temperatura < 24:
        return 'FRIO'

    if temperatura > 34:
        return 'CALOR'

    return 'NORMAL'


def generar_temperatura_simulada():
    """
    Genera una temperatura simulada según la hora del día.

    Esto hace que la simulación sea más realista.

    Ejemplo:
    - Mañana: temperatura moderada.
    - Tarde: temperatura más alta.
    - Noche: temperatura más baja.
    """

    hora_actual = timezone.localtime().hour

    # Madrugada y noche: más frío
    if hora_actual >= 20 or hora_actual < 6:
        temperatura = random.uniform(22, 27)

    # Mañana: temperatura normal
    elif 6 <= hora_actual < 12:
        temperatura = random.uniform(24, 30)

    # Tarde: temperatura más caliente
    else:
        temperatura = random.uniform(30, 38)

    # Redondeamos a 2 decimales para que se vea mejor
    return round(temperatura, 2)


class TemperaturaTiempoRealView(APIView):
    """
    CU09 - Monitorear temperatura en tiempo real.

    Endpoint:
    GET /temperatura/tiempo-real/

    Funcionamiento:
    1. Busca todos los galpones activos.
    2. Genera una temperatura simulada para cada galpón.
    3. Calcula si está en FRIO, NORMAL o CALOR.
    4. Guarda el registro en la base de datos.
    5. Devuelve la temperatura actual al frontend.

    El frontend llamará a este endpoint cada 5 segundos.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        galpones = Galpon.objects.filter(estado='activo').order_by('id')

        data = []

        for galpon in galpones:
            temperatura = generar_temperatura_simulada()
            estado = calcular_estado_temperatura(temperatura)

            registro = TemperaturaGalpon.objects.create(
                galpon=galpon,
                temperatura=temperatura,
                estado=estado,
                fuente='SIMULADO'
            )

            data.append({
                'id': registro.id,
                'id_galpon': galpon.id,
                'galpon_nombre': galpon.nombre,
                'temperatura': registro.temperatura,
                'estado': registro.estado,
                'fuente': registro.fuente,
                'fecha_hora': registro.fecha_hora,
                'alerta': estado in ['FRIO', 'CALOR'],
                'mensaje': obtener_mensaje_estado(estado),
            })

        return Response(data, status=status.HTTP_200_OK)


class TemperaturaManualCreateView(APIView):
    """
    CU08 - Registrar temperatura del galpón manualmente.

    Endpoint:
    POST /temperatura/manual/

    Sirve para que el operario pueda ingresar una temperatura manual.

    Esto es útil para pruebas:
    - Si ingresas 22°C, el sistema marca FRIO.
    - Si ingresas 28°C, el sistema marca NORMAL.
    - Si ingresas 38°C, el sistema marca CALOR.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TemperaturaGalponSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        galpon = serializer.validated_data['galpon']
        temperatura = serializer.validated_data['temperatura']
        estado = calcular_estado_temperatura(temperatura)

        registro = TemperaturaGalpon.objects.create(
            galpon=galpon,
            temperatura=temperatura,
            estado=estado,
            fuente='MANUAL'
        )

        registrar_evento(
            request,
            accion='crear',
            modulo='temperatura',
            entidad='TemperaturaGalpon',
            entidad_id=registro.id,
            entidad_nombre=f"Temperatura {registro.temperatura}°C - {galpon.nombre}",
            detalle={
                'id_galpon': galpon.id,
                'galpon': galpon.nombre,
                'temperatura': registro.temperatura,
                'estado': registro.estado,
                'fuente': registro.fuente,
            },
            usuario=request.user,
        )

        return Response(
            TemperaturaGalponSerializer(registro).data,
            status=status.HTTP_201_CREATED
        )


class TemperaturaHistorialView(APIView):
    """
    Consulta el historial de temperaturas.

    Endpoint:
    GET /temperatura/historial/

    Filtros opcionales:
    - id_galpon
    - fecha_inicio
    - fecha_fin

    Ejemplos:
    /temperatura/historial/
    /temperatura/historial/?id_galpon=1
    /temperatura/historial/?fecha_inicio=2026-05-01&fecha_fin=2026-05-07
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = TemperaturaGalpon.objects.select_related('galpon').all()

        id_galpon = request.query_params.get('id_galpon')
        fecha_inicio_raw = request.query_params.get('fecha_inicio')
        fecha_fin_raw = request.query_params.get('fecha_fin')

        if id_galpon:
            queryset = queryset.filter(galpon_id=id_galpon)

        if fecha_inicio_raw:
            fecha_inicio = parse_date(fecha_inicio_raw)
            if fecha_inicio is None:
                return Response(
                    {'fecha_inicio': 'Formato inválido. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            queryset = queryset.filter(fecha_hora__date__gte=fecha_inicio)

        if fecha_fin_raw:
            fecha_fin = parse_date(fecha_fin_raw)
            if fecha_fin is None:
                return Response(
                    {'fecha_fin': 'Formato inválido. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            queryset = queryset.filter(fecha_hora__date__lte=fecha_fin)

        queryset = queryset.order_by('-fecha_hora', '-id')[:100]

        return Response(
            TemperaturaGalponSerializer(queryset, many=True).data,
            status=status.HTTP_200_OK
        )


class TemperaturaUltimaPorGalponView(APIView):
    """
    Devuelve la última temperatura registrada por cada galpón.

    Endpoint:
    GET /temperatura/ultimas/

    Esta vista es útil para mostrar tarjetas en el dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        galpones = Galpon.objects.all().order_by('id')
        data = []

        for galpon in galpones:
            ultimo = (
                TemperaturaGalpon.objects
                .filter(galpon=galpon)
                .order_by('-fecha_hora', '-id')
                .first()
            )

            if ultimo:
                data.append({
                    'id_galpon': galpon.id,
                    'galpon_nombre': galpon.nombre,
                    'temperatura': ultimo.temperatura,
                    'estado': ultimo.estado,
                    'fuente': ultimo.fuente,
                    'fecha_hora': ultimo.fecha_hora,
                    'alerta': ultimo.estado in ['FRIO', 'CALOR'],
                    'mensaje': obtener_mensaje_estado(ultimo.estado),
                })
            else:
                data.append({
                    'id_galpon': galpon.id,
                    'galpon_nombre': galpon.nombre,
                    'temperatura': None,
                    'estado': 'SIN_DATOS',
                    'fuente': None,
                    'fecha_hora': None,
                    'alerta': False,
                    'mensaje': 'Todavía no hay registros de temperatura.',
                })

        return Response(data, status=status.HTTP_200_OK)


def obtener_mensaje_estado(estado):
    """
    Devuelve un mensaje entendible para el frontend.
    """

    if estado == 'FRIO':
        return 'Alerta de frío: la temperatura está por debajo del rango recomendado.'

    if estado == 'CALOR':
        return 'Alerta de calor: la temperatura está por encima del rango recomendado.'

    if estado == 'NORMAL':
        return 'Temperatura dentro del rango normal.'

    return 'Sin información de temperatura.'

class TemperaturaAlertasView(APIView):
    """
    Endpoint global para detectar alertas de temperatura.

    Endpoint:
    GET /temperatura/alertas/

    Sirve para mostrar alertas flotantes en cualquier pantalla del frontend.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        galpones = Galpon.objects.filter(estado='activo').order_by('id')

        alertas = []

        for galpon in galpones:
            temperatura = generar_temperatura_simulada()
            estado = calcular_estado_temperatura(temperatura)

            registro = TemperaturaGalpon.objects.create(
                galpon=galpon,
                temperatura=temperatura,
                estado=estado,
                fuente='SIMULADO'
            )

            if estado in ['FRIO', 'CALOR']:
                alertas.append({
                    'id': registro.id,
                    'id_galpon': galpon.id,
                    'galpon_nombre': galpon.nombre,
                    'temperatura': registro.temperatura,
                    'estado': registro.estado,
                    'fuente': registro.fuente,
                    'fecha_hora': registro.fecha_hora,
                    'alerta': True,
                    'mensaje': obtener_mensaje_estado(estado),
                })

        return Response(alertas, status=status.HTTP_200_OK)

