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

from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Count, Q, Sum, ProtectedError
from django.db.models.functions import Coalesce

from apps.core.mixins import TenantSafeView
from apps.galpones.models import Galpon
from apps.galpones.serializers import GalponSerializer
from apps.bitacora.utils import registrar_evento


class GalponListCreateView(TenantSafeView):
    """Lista y crea galpones con aislamiento multi-tenant y límites SaaS."""
    permission_classes = [IsAuthenticated]
    queryset = Galpon.objects.all()

    def get(self, request):
        """Devuelve los galpones de la empresa del usuario logueado."""
        galpones = self.get_queryset().order_by('id')
        return Response(GalponSerializer(
            galpones, many=True).data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        """Inyecta de forma segura el empresa_id del usuario actual."""
        user = getattr(self.request, 'user', None)
        empresa_id = getattr(user, 'empresa_id', None)
        return serializer.save(empresa_id=empresa_id)

    def post(self, request):
        """Crea un galpón aplicando validación de cuota de plan SaaS."""
        user = getattr(request, 'user', None)
        empresa = getattr(user, 'empresa', None) if user else None

        # Validación de cuota SaaS
        if empresa and getattr(empresa, 'plan', None):
            max_galpones = empresa.plan.max_galpones
            if max_galpones is not None:
                actuales = Galpon.objects.filter(empresa_id=empresa.id).count()
                if actuales >= max_galpones:
                    raise serializers.ValidationError(
                        "Has alcanzado el límite de galpones de tu Plan Básico. Mejora tu plan para añadir más."
                    )

        serializer = GalponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

        galpon = self.perform_create(serializer)
        registrar_evento(
            request,
            accion='crear',
            modulo='galpones',
            entidad='Galpon',
            entidad_id=getattr(galpon, 'id', None),
            entidad_nombre=getattr(galpon, 'nombre', None),
            detalle={'nombre': getattr(galpon, 'nombre', None)},
            usuario=request.user,
        )
        return Response(GalponSerializer(galpon).data,
                        status=status.HTTP_201_CREATED)


class GalponDetailView(TenantSafeView):
    """Obtiene/actualiza/elimina un galpón específico asegurando pertenencia al tenant."""
    permission_classes = [IsAuthenticated]
    queryset = Galpon.objects.all()

    def _get_galpon_or_404(self, galpon_id):
        """Helper para obtener un galpón filtrado por el tenant actual."""
        try:
            return self.get_queryset().get(pk=galpon_id)
        except Galpon.DoesNotExist:
            return None

    def get(self, request, galpon_id):
        galpon = self._get_galpon_or_404(galpon_id)
        if not galpon:
            return Response({'detail': 'Galpón no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(GalponSerializer(galpon).data,
                        status=status.HTTP_200_OK)

    def put(self, request, galpon_id):
        galpon = self._get_galpon_or_404(galpon_id)
        if not galpon:
            return Response({'detail': 'Galpón no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = GalponSerializer(galpon, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

        # Mantenemos inmutable el empresa_id original
        empresa_id = getattr(galpon, 'empresa_id', None)
        galpon = serializer.save(empresa_id=empresa_id)
        registrar_evento(
            request,
            accion='editar',
            modulo='galpones',
            entidad='Galpon',
            entidad_id=getattr(galpon, 'id', None),
            entidad_nombre=getattr(galpon, 'nombre', None),
            usuario=request.user,
        )
        return Response(GalponSerializer(galpon).data,
                        status=status.HTTP_200_OK)

    def patch(self, request, galpon_id):
        galpon = self._get_galpon_or_404(galpon_id)
        if not galpon:
            return Response({'detail': 'Galpón no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = GalponSerializer(galpon, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

        empresa_id = getattr(galpon, 'empresa_id', None)
        galpon = serializer.save(empresa_id=empresa_id)
        registrar_evento(
            request,
            accion='editar',
            modulo='galpones',
            entidad='Galpon',
            entidad_id=getattr(galpon, 'id', None),
            entidad_nombre=getattr(galpon, 'nombre', None),
            usuario=request.user,
        )
        return Response(GalponSerializer(galpon).data,
                        status=status.HTTP_200_OK)

    def delete(self, request, galpon_id):
        galpon = self._get_galpon_or_404(galpon_id)
        if not galpon:
            return Response({'detail': 'Galpón no encontrado.'},
                            status=status.HTTP_404_NOT_FOUND)

        registrar_evento(
            request,
            accion='eliminar',
            modulo='galpones',
            entidad='Galpon',
            entidad_id=getattr(galpon, 'id', None),
            entidad_nombre=getattr(galpon, 'nombre', None),
            detalle={'nombre': getattr(galpon, 'nombre', None)},
            usuario=request.user,
        )
        try:
            galpon.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': 'No puedes eliminar este galpón porque tiene lotes registrados. Elimina o reasigna los lotes primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class GalponEstadoListView(TenantSafeView):
    """Resumen de estado por galpón filtrado por tenant."""
    permission_classes = [IsAuthenticated]
    queryset = Galpon.objects.all()

    def get(self, request):
        queryset = (
            self.get_queryset()
            .annotate(
                total_lotes=Count('lotes', distinct=True),
                aves_actuales=Coalesce(Sum('lotes__cantidad_actual'), 0),
                lotes_crianza=Count(
                    'lotes',
                    filter=Q(lotes__estado='Crianza'),
                    distinct=True),
                lotes_activo=Count(
                    'lotes',
                    filter=Q(lotes__estado='activo'),
                    distinct=True),
                lotes_finalizado=Count(
                    'lotes',
                    filter=Q(lotes__estado='finalizado'),
                    distinct=True),
            )
            .order_by('id')
        )

        data = []
        for g in queryset:
            capacidad = getattr(g, 'capacidad', 0) or 0
            aves_actuales = int(getattr(g, 'aves_actuales', 0) or 0)
            porcentaje_ocupacion = None
            if capacidad > 0:
                porcentaje_ocupacion = round((aves_actuales / capacidad) * 100, 2)

            data.append(
                {
                    'galpon': GalponSerializer(g).data,
                    'total_lotes': int(getattr(g, 'total_lotes', 0) or 0),
                    'aves_actuales': aves_actuales,
                    'porcentaje_ocupacion': porcentaje_ocupacion,
                    'lotes_por_estado': {
                        'Crianza': int(getattr(g, 'lotes_crianza', 0) or 0),
                        'activo': int(getattr(g, 'lotes_activo', 0) or 0),
                        'finalizado': int(getattr(g, 'lotes_finalizado', 0) or 0),
                    },
                }
            )

        return Response(data, status=status.HTTP_200_OK)
