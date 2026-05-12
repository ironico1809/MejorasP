"""Utilidades de la app `bitacora`.

Este módulo se importa desde otras apps para registrar eventos sin repetir código.

Compatibilidad:
- El proyecto ya llama a `registrar_evento()` desde muchas apps con parámetros
    `accion`, `modulo`, `entidad`, `entidad_id`, `detalle`, etc.
- Como el esquema nuevo solo tiene `accion` y `descripcion`, empaquetamos el resto
    dentro de `descripcion` (texto/JSON) para no perder contexto.
"""

import json

from apps.bitacora.models import BitacoraEvento


def _get_client_ip(request):
    """Extrae la IP del cliente desde el request.

    - Entrada: `request` de Django/DRF (o None).
    - Salida: string con IP o None.
    """
    if not request:
        return None

    # Headers comunes cuando hay proxy/reverse-proxy (nginx, cloudflare, etc.)
    for header in (
        'HTTP_CF_CONNECTING_IP',
        'HTTP_TRUE_CLIENT_IP',
        'HTTP_X_REAL_IP',
    ):
        value = request.META.get(header)
        if value:
            value = value.strip()
            if value:
                return value

    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        # puede venir: "ip1, ip2, ip3"
        first = xff.split(',')[0].strip()
        return first or None

    value = request.META.get('REMOTE_ADDR')
    return value.strip() if isinstance(value, str) and value.strip() else value


def registrar_evento(
    request,
    *,
    accion,
    modulo,
    entidad=None,
    entidad_id=None,
    entidad_nombre=None,
    detalle=None,
    extra=None,
    usuario=None,
):
    """Registra un evento en la tabla `bitacora`.

    Entrada:
    - `accion`: requerido.
    - `descripcion`: se arma a partir de `modulo`, `entidad`, `entidad_id`, `detalle`
      y contexto HTTP (si existe `request`).

    Salida: None (side-effect: inserta fila).
    """

    try:
        actor = usuario
        if actor is None and request is not None:
            actor = getattr(request, 'user', None)

        descripcion_payload = {
            'modulo': str(modulo) if modulo is not None else None,
            'entidad': entidad,
            'entidad_id': str(entidad_id) if entidad_id is not None else None,
            'entidad_nombre': str(entidad_nombre) if entidad_nombre is not None else None,
            'detalle': detalle,
            'extra': extra,
            'http': {
                'metodo': getattr(request, 'method', None),
                'path': getattr(request, 'path', None),
                'ip': _get_client_ip(request),
                'user_agent': (request.META.get('HTTP_USER_AGENT') if request is not None else None),
            }
            if request is not None
            else None,
        }

        descripcion_txt = json.dumps(descripcion_payload, ensure_ascii=False, default=str)

        BitacoraEvento.objects.create(
            usuario=actor if getattr(actor, 'is_authenticated', False) else None,
            accion=str(accion),
            descripcion=descripcion_txt,
        )
    except Exception:
        # La bitácora nunca debe tumbar el request
        return
