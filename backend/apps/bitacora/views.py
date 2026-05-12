"""Vistas (endpoints) de la app `bitacora`.

Expone el endpoint de consulta alineado al esquema solicitado.
"""

from django.utils.dateparse import parse_datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import BitacoraEvento
from apps.bitacora.serializers import BitacoraEventoSerializer

class BitacoraListView(APIView):
    """Lista eventos de bitácora.

    Endpoint:
      - GET /bitacora/

        Filtros opcionales:
            - ?usuario_id=
            - ?accion=
            - ?desde= (ISO datetime, filtra por `fecha_hora`)
            - ?hasta= (ISO datetime, filtra por `fecha_hora`)
            - ?limit= (default 200, max 1000)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retorna una lista de eventos.

        - Entrada: query params (filtros y limit).
        - Salida: `200 OK` con array JSON de eventos serializados.
        """
        qs = BitacoraEvento.objects.all()

        usuario_id = request.query_params.get('usuario_id')
        if usuario_id:
            qs = qs.filter(usuario_id=usuario_id)

        accion = request.query_params.get('accion')
        if accion:
            qs = qs.filter(accion=accion)

        desde = request.query_params.get('desde')
        if desde:
            dt = parse_datetime(desde)
            if dt:
                qs = qs.filter(fecha_hora__gte=dt)

        hasta = request.query_params.get('hasta')
        if hasta:
            dt = parse_datetime(hasta)
            if dt:
                qs = qs.filter(fecha_hora__lte=dt)

        try:
            limit = int(request.query_params.get('limit', 200))
        except ValueError:
            limit = 200
        limit = max(1, min(limit, 1000))

        data = BitacoraEventoSerializer(qs[:limit], many=True).data
        return Response(data, status=status.HTTP_200_OK)
