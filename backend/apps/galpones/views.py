"""Vistas (endpoints) de la app `galpones`.

Endpoints principales:
- `GET /galpones/`    -> lista galpones.
- `POST /galpones/`   -> crea galpón.
- `GET /galpones/<id>/`    -> obtiene un galpón.
- `PUT/PATCH /galpones/<id>/` -> actualiza un galpón.
- `DELETE /galpones/<id>/` -> elimina un galpón.
- `GET /galpones/estado/`  -> resumen por galpón (lotes y ocupación).

Todas las rutas requieren JWT (IsAuthenticated) excepto que se cambie explícitamente.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce

from apps.galpones.models import Galpon
from apps.galpones.serializers import GalponSerializer
from apps.bitacora.utils import registrar_evento


class GalponListCreateView(APIView):
	"""Lista y crea galpones.

	- GET: devuelve `200 OK` con lista de galpones.
	- POST: valida payload y devuelve `201 Created` con el galpón creado.
	"""
	permission_classes = [IsAuthenticated]

	def get(self, request):
		"""Devuelve todos los galpones ordenados por id."""
		galpones = Galpon.objects.all().order_by('id')
		return Response(GalponSerializer(galpones, many=True).data, status=status.HTTP_200_OK)

	def post(self, request):
		"""Crea un galpón.

		Entrada: JSON validado por `GalponSerializer`.
		Salida: `201` con el galpón serializado o `400` con errores.
		Además registra evento en bitácora.
		"""
		serializer = GalponSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		galpon = serializer.save()
		registrar_evento(
			request,
			accion='crear',
			modulo='galpones',
			entidad='Galpon',
			entidad_id=galpon.id,
			entidad_nombre=galpon.nombre,
			detalle={'nombre': galpon.nombre},
			usuario=request.user,
		)
		return Response(GalponSerializer(galpon).data, status=status.HTTP_201_CREATED)


class GalponDetailView(APIView):
	"""Obtiene/actualiza/elimina un galpón específico por id."""
	permission_classes = [IsAuthenticated]

	def _get_galpon_or_404(self, galpon_id):
		"""Helper para obtener un galpón o devolver None si no existe."""
		try:
			return Galpon.objects.get(pk=galpon_id)
		except Galpon.DoesNotExist:
			return None

	def get(self, request, galpon_id):
		"""Devuelve `200` con el galpón o `404` si no existe."""
		galpon = self._get_galpon_or_404(galpon_id)
		if not galpon:
			return Response({'detail': 'Galpón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
		return Response(GalponSerializer(galpon).data, status=status.HTTP_200_OK)

	def put(self, request, galpon_id):
		"""Reemplaza por completo el galpón (PUT).

		Entrada: JSON completo.
		Salida: `200` con galpón actualizado, `400` si inválido, `404` si no existe.
		"""
		galpon = self._get_galpon_or_404(galpon_id)
		if not galpon:
			return Response({'detail': 'Galpón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		serializer = GalponSerializer(galpon, data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		galpon = serializer.save()
		registrar_evento(
			request,
			accion='editar',
			modulo='galpones',
			entidad='Galpon',
			entidad_id=galpon.id,
			entidad_nombre=galpon.nombre,
			usuario=request.user,
		)
		return Response(GalponSerializer(galpon).data, status=status.HTTP_200_OK)

	def patch(self, request, galpon_id):
		"""Actualiza parcialmente el galpón (PATCH)."""
		galpon = self._get_galpon_or_404(galpon_id)
		if not galpon:
			return Response({'detail': 'Galpón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		serializer = GalponSerializer(galpon, data=request.data, partial=True)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		galpon = serializer.save()
		registrar_evento(
			request,
			accion='editar',
			modulo='galpones',
			entidad='Galpon',
			entidad_id=galpon.id,
			entidad_nombre=galpon.nombre,
			usuario=request.user,
		)
		return Response(GalponSerializer(galpon).data, status=status.HTTP_200_OK)

	def delete(self, request, galpon_id):
		"""Elimina el galpón.

		Salida: `204 No Content` si se elimina, `404` si no existe.
		"""
		galpon = self._get_galpon_or_404(galpon_id)
		if not galpon:
			return Response({'detail': 'Galpón no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		registrar_evento(
			request,
			accion='eliminar',
			modulo='galpones',
			entidad='Galpon',
			entidad_id=galpon.id,
			entidad_nombre=galpon.nombre,
			detalle={'nombre': galpon.nombre},
			usuario=request.user,
		)
		galpon.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class GalponEstadoListView(APIView):
	"""Resumen de estado por galpón para dashboard.

	Endpoint:
	  - GET /galpones/estado/
	"""

	permission_classes = [IsAuthenticated]

	def get(self, request):
		"""Devuelve un resumen agregado por galpón.

		Salida (`200 OK`): array con objetos que incluyen:
		- `galpon`: datos del galpón.
		- `total_lotes`, `aves_actuales`, `porcentaje_ocupacion`.
		- `lotes_por_estado`: conteos por estado.
		"""
		queryset = (
			Galpon.objects.all()
			.annotate(
				total_lotes=Count('lotes', distinct=True),
				aves_actuales=Coalesce(Sum('lotes__cantidad_actual'), 0),
				lotes_crianza=Count('lotes', filter=Q(lotes__estado='Crianza'), distinct=True),
				lotes_activo=Count('lotes', filter=Q(lotes__estado='activo'), distinct=True),
				lotes_finalizado=Count('lotes', filter=Q(lotes__estado='finalizado'), distinct=True),
			)
			.order_by('id')
		)

		data = []
		for g in queryset:
			capacidad = g.capacidad or 0
			aves_actuales = int(g.aves_actuales or 0)
			porcentaje_ocupacion = None
			if capacidad > 0:
				porcentaje_ocupacion = round((aves_actuales / capacidad) * 100, 2)

			data.append(
				{
					'galpon': GalponSerializer(g).data,
					'total_lotes': int(g.total_lotes or 0),
					'aves_actuales': aves_actuales,
					'porcentaje_ocupacion': porcentaje_ocupacion,
					'lotes_por_estado': {
						'Crianza': int(g.lotes_crianza or 0),
						'activo': int(g.lotes_activo or 0),
						'finalizado': int(g.lotes_finalizado or 0),
					},
				}
			)

		return Response(data, status=status.HTTP_200_OK)
