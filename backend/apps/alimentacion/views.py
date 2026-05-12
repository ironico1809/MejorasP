from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.alimentacion.models import Alimentacion
from apps.alimentacion.serializers import AlimentacionSerializer
from apps.bitacora.utils import registrar_evento


class AlimentacionListCreateView(APIView):
	"""CU11 y CU12.

	- CU11: Registrar consumo -> POST /alimentacion/
	- CU12: Consultar historial -> GET /alimentacion/ (con filtros)

	Filtros (query params) para GET:
	- `id_lote` (opcional)
	- `fecha_inicio` (opcional, formato YYYY-MM-DD)
	- `fecha_fin` (opcional, formato YYYY-MM-DD)
	"""

	permission_classes = [IsAuthenticated]

	def _parse_query_date(self, value, field_name):
		if not value:
			return None, None
		parsed = parse_date(value)
		if parsed is None:
			return None, {field_name: 'Formato inválido. Use YYYY-MM-DD.'}
		return parsed, None

	def get(self, request):
		queryset = Alimentacion.objects.select_related('lote').all().order_by('-fecha', '-id_alimentacion')

		id_lote = request.query_params.get('id_lote')
		if id_lote:
			queryset = queryset.filter(lote_id=id_lote)

		fecha_inicio_raw = request.query_params.get('fecha_inicio')
		fecha_fin_raw = request.query_params.get('fecha_fin')

		fecha_inicio, err = self._parse_query_date(fecha_inicio_raw, 'fecha_inicio')
		if err:
			return Response(err, status=status.HTTP_400_BAD_REQUEST)
		fecha_fin, err = self._parse_query_date(fecha_fin_raw, 'fecha_fin')
		if err:
			return Response(err, status=status.HTTP_400_BAD_REQUEST)

		if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
			return Response(
				{'detail': '`fecha_inicio` no puede ser mayor que `fecha_fin`.'},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if fecha_inicio:
			queryset = queryset.filter(fecha__gte=fecha_inicio)
		if fecha_fin:
			queryset = queryset.filter(fecha__lte=fecha_fin)

		return Response(AlimentacionSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = AlimentacionSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		alimentacion = serializer.save()
		entidad_nombre = f"Alimentación {alimentacion.id_alimentacion} - Lote {alimentacion.lote_id}"
		registrar_evento(
			request,
			accion='crear',
			modulo='alimentacion',
			entidad='Alimentacion',
			entidad_id=alimentacion.id_alimentacion,
			entidad_nombre=entidad_nombre,
			detalle={
				'id_lote': alimentacion.lote_id,
				'fecha': alimentacion.fecha,
				'cantidad_kg': alimentacion.cantidad_kg,
				'tipo_alimento': alimentacion.tipo_alimento,
			},
			usuario=request.user,
		)
		return Response(AlimentacionSerializer(alimentacion).data, status=status.HTTP_201_CREATED)
