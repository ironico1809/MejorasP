"""App `usuarios`.

Responsabilidades principales:
- Autenticación y sesión vía JWT (login/refresh/verify/logout).
- Gestión de usuarios (CRUD) y auto-consulta del usuario autenticado (`/me/`).
- Gestión de roles (CRUD) y asignación de roles a usuarios (tabla puente).

Notas de diseño:
- Este proyecto NO usa `AUTH_USER_MODEL` de Django; usa un modelo propio `Usuario`.
- Para que DRF lo trate como usuario autenticado, `Usuario` expone `is_authenticated`.
- La autenticación se implementa en `apps.usuarios.authentication.UsuarioJWTAuthentication`.
"""

