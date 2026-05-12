"""Vistas (endpoints) de la app `lotes`.

Endpoints:
- `GET /lotes/` -> lista lotes (opcional filtro por `id_galpon`).
- `POST /lotes/` -> crea lote.
- `GET /lotes/<id>/` -> detalle.
- `PUT/PATCH /lotes/<id>/` -> actualización.
- `DELETE /lotes/<id>/` -> eliminación.
- `GET /lotes/resumen/estados/` -> agregación por estado.

Todas las rutas requieren autenticación (IsAuthenticated).
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce

from apps.lotes.models import Lote
from apps.lotes.serializers import LoteSerializer
from apps.bitacora.utils import registrar_evento


class LoteListCreateView(APIView):
	"""Lista y crea lotes."""
	permission_classes = [IsAuthenticated]

	def get(self, request):
		"""Lista lotes.

		Query params:
		- `id_galpon` (opcional): filtra por galpón.

		Devuelve: `200 OK` con lista JSON de lotes.
		"""
		queryset = Lote.objects.all().order_by('-id_lote')

		id_galpon = request.query_params.get('id_galpon')
		if id_galpon:
			queryset = queryset.filter(galpon_id=id_galpon)

		return Response(LoteSerializer(queryset, many=True).data, status=status.HTTP_200_OK)

	def post(self, request):
		"""Crea un lote.

		Entrada: JSON validado por `LoteSerializer`.
		Devuelve: `201 Created` con lote serializado o `400` con errores.
		Registra evento en bitácora.
		"""
		serializer = LoteSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		lote = serializer.save()
		galpon_nombre = None
		try:
			galpon_nombre = getattr(getattr(lote, 'galpon', None), 'nombre', None)
		except Exception:
			galpon_nombre = None
		entidad_nombre = (
			f"Lote {lote.id_lote} - Galpón {galpon_nombre}" if galpon_nombre else f"Lote {lote.id_lote}"
		)
		registrar_evento(
			request,
			accion='crear',
			modulo='lotes',
			entidad='Lote',
			entidad_id=lote.id_lote,
			entidad_nombre=entidad_nombre,
			detalle={'id_galpon': lote.galpon_id, 'cantidad_inicial': lote.cantidad_inicial},
			usuario=request.user,
		)
		return Response(LoteSerializer(lote).data, status=status.HTTP_201_CREATED)


class LoteDetailView(APIView):
	"""CRUD sobre un lote específico por id."""
	permission_classes = [IsAuthenticated]

	def _get_lote_or_404(self, id_lote):
		"""Helper: retorna el lote o None si no existe."""
		try:
			return Lote.objects.get(pk=id_lote)
		except Lote.DoesNotExist:
			return None

	def get(self, request, id_lote):
		"""Devuelve `200` con el lote o `404` si no existe."""
		lote = self._get_lote_or_404(id_lote)
		if not lote:
			return Response({'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
		return Response(LoteSerializer(lote).data, status=status.HTTP_200_OK)

	def put(self, request, id_lote):
		"""Reemplaza por completo los datos del lote (PUT)."""
		lote = self._get_lote_or_404(id_lote)
		if not lote:
			return Response({'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		serializer = LoteSerializer(lote, data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		lote = serializer.save()
		galpon_nombre = None
		try:
			galpon_nombre = getattr(getattr(lote, 'galpon', None), 'nombre', None)
		except Exception:
			galpon_nombre = None
		entidad_nombre = (
			f"Lote {lote.id_lote} - Galpón {galpon_nombre}" if galpon_nombre else f"Lote {lote.id_lote}"
		)
		registrar_evento(
			request,
			accion='editar',
			modulo='lotes',
			entidad='Lote',
			entidad_id=lote.id_lote,
			entidad_nombre=entidad_nombre,
			usuario=request.user,
		)
		return Response(LoteSerializer(lote).data, status=status.HTTP_200_OK)

	def patch(self, request, id_lote):
		"""Actualiza parcialmente un lote (PATCH)."""
		lote = self._get_lote_or_404(id_lote)
		if not lote:
			return Response({'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		serializer = LoteSerializer(lote, data=request.data, partial=True)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		lote = serializer.save()
		galpon_nombre = None
		try:
			galpon_nombre = getattr(getattr(lote, 'galpon', None), 'nombre', None)
		except Exception:
			galpon_nombre = None
		entidad_nombre = (
			f"Lote {lote.id_lote} - Galpón {galpon_nombre}" if galpon_nombre else f"Lote {lote.id_lote}"
		)
		registrar_evento(
			request,
			accion='editar',
			modulo='lotes',
			entidad='Lote',
			entidad_id=lote.id_lote,
			entidad_nombre=entidad_nombre,
			usuario=request.user,
		)
		return Response(LoteSerializer(lote).data, status=status.HTTP_200_OK)

	def delete(self, request, id_lote):
		"""Elimina el lote.

		Devuelve: `204 No Content` o `404` si no existe.
		"""
		lote = self._get_lote_or_404(id_lote)
		if not lote:
			return Response({'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

		galpon_nombre = None
		try:
			galpon_nombre = getattr(getattr(lote, 'galpon', None), 'nombre', None)
		except Exception:
			galpon_nombre = None
		entidad_nombre = (
			f"Lote {lote.id_lote} - Galpón {galpon_nombre}" if galpon_nombre else f"Lote {lote.id_lote}"
		)
		registrar_evento(
			request,
			accion='eliminar',
			modulo='lotes',
			entidad='Lote',
			entidad_id=lote.id_lote,
			entidad_nombre=entidad_nombre,
			detalle={'id_galpon': lote.galpon_id},
			usuario=request.user,
		)
		lote.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class LotesResumenEstadoView(APIView):
	"""Resumen global de lotes agrupado por estado.

	Endpoint:
	  - GET /lotes/resumen/estados/
	"""

	permission_classes = [IsAuthenticated]

	def get(self, request):
		"""Devuelve agregación por estado.

		Salida (`200 OK`): lista de objetos con:
		- `estado`
		- `total_lotes`
		- `aves_actuales`
		"""
		rows = (
			Lote.objects.values('estado')
			.annotate(
				total_lotes=Count('id_lote'),
				aves_actuales=Coalesce(Sum('cantidad_actual'), 0),
			)
			.order_by('estado')
		)

		return Response(list(rows), status=status.HTTP_200_OK)
