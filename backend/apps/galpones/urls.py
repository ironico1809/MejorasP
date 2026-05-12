"""Rutas (URLs) de la app `galpones`."""

from django.urls import path

from apps.galpones.views import GalponDetailView, GalponEstadoListView, GalponListCreateView

urlpatterns = [
    # CRUD
    path('', GalponListCreateView.as_view(), name='galpones_list_create'),
    # Resumen para dashboard
    path('estado/', GalponEstadoListView.as_view(), name='galpones_estado'),
    path('<int:galpon_id>/', GalponDetailView.as_view(), name='galpones_detail'),
]
