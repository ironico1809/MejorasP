from django.urls import path

from apps.alimentacion.views import AlimentacionListCreateView

urlpatterns = [
	path('', AlimentacionListCreateView.as_view(), name='alimentacion_list_create'),
]
