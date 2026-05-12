from django.urls import path

from apps.temperatura.views import (
    TemperaturaTiempoRealView,
    TemperaturaManualCreateView,
    TemperaturaHistorialView,
    TemperaturaUltimaPorGalponView,
    TemperaturaAlertasView,
)

urlpatterns = [
    # CU09: monitoreo en tiempo real simulado
    path('tiempo-real/', TemperaturaTiempoRealView.as_view(), name='temperatura_tiempo_real'),

    # CU08: registro manual de temperatura
    path('manual/', TemperaturaManualCreateView.as_view(), name='temperatura_manual'),

    # Historial de temperaturas
    path('historial/', TemperaturaHistorialView.as_view(), name='temperatura_historial'),

    # Última temperatura por galpón
    path('ultimas/', TemperaturaUltimaPorGalponView.as_view(), name='temperatura_ultimas'),
   
    # Nueva ruta para alertas globales
    path('alertas/', TemperaturaAlertasView.as_view(), name='temperatura_alertas'),
]