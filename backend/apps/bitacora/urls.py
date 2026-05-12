"""Rutas (URLs) de la app `bitacora`.

Endpoints:
- `GET /bitacora/` -> lista eventos de auditoría.
"""

from django.urls import path

from apps.bitacora.views import BitacoraListView

urlpatterns = [
    path('', BitacoraListView.as_view(), name='bitacora_list'),
]
