"""from django.urls import path

from apps.sanitario.views import AplicacionesSanitariasView, HistorialClinicoLotesView, AplicacionSanitariaDetailView

urlpatterns = [
    path(
        'aplicaciones/',
        AplicacionesSanitariasView.as_view(),
        name='aplicaciones_sanitarias'),
    path(
        'historial/',
        HistorialClinicoLotesView.as_view(),
        name='historial_clinico_lotes'),
    path(
        'aplicaciones/<int:pk>/',
        AplicacionSanitariaDetailView.as_view(),
        name='aplicacion_sanitaria_detail'),
]
"""

from django.urls import path

from apps.sanitario.views import (
    AplicacionesSanitariasView,
    HistorialClinicoLotesView,
    RegistroEnfermedadLoteView,
    AlertasSanitariasView,
    EvaluarAlertasSanitariasView,
    CambiarEstadoAlertaSanitariaView,
)

urlpatterns = [
    # CU16: tratamientos sanitarios aplicados
    path(
        'aplicaciones/',
        AplicacionesSanitariasView.as_view(),
        name='aplicaciones_sanitarias'
    ),

    # Historial clínico por lote
    path(
        'historial/',
        HistorialClinicoLotesView.as_view(),
        name='historial_clinico_lotes'
    ),

    # Apoyo para CU15: registro de enfermedades por lote
    path(
        'enfermedades/',
        RegistroEnfermedadLoteView.as_view(),
        name='registro_enfermedad_lote'
    ),

    # CU17: listado de alertas sanitarias
    path(
        'alertas/',
        AlertasSanitariasView.as_view(),
        name='alertas_sanitarias'
    ),

    # CU17: evaluar riesgos sanitarios automáticamente
    path(
        'alertas/evaluar/',
        EvaluarAlertasSanitariasView.as_view(),
        name='evaluar_alertas_sanitarias'
    ),

    # CU17: cambiar estado de una alerta
    path(
        'alertas/<int:alerta_id>/estado/',
        CambiarEstadoAlertaSanitariaView.as_view(),
        name='cambiar_estado_alerta_sanitaria'
    ),
]
