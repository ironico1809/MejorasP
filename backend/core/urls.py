from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('usuarios/', include('apps.usuarios.urls')),
    path('permisos/', include('apps.permisos.urls')),
    path('temperatura/', include('apps.temperatura.urls')),
    path('galpones/', include('apps.galpones.urls')),
    path('lotes/', include('apps.lotes.urls')),
    path('alimentacion/', include('apps.alimentacion.urls')),
    path('bitacora/', include('apps.bitacora.urls')),
]
