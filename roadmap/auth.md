# Auth Roadmap

## ✅ Completado
- ✅ Arquitectura auth desacoplada para Fuse (`createAuthRoutes`, `createFuseAuthViews`, adapter/provider).
- ✅ Login JWT con payload `login` + `password`.
- ✅ Auto-login en recarga usando token + `me`.
- ✅ OTP por SMS (`request` + `verify`).
- ✅ Refresh token flow en cliente autenticado.
- ✅ Signup alineado al contrato actual (camelCase, `username: null`).
- ✅ Verificación de cuenta por `uid/token` desde query params.
- ✅ Reenvío de verificación con cooldown de 30s + timer visible.
- ✅ Botones de verify ordenados: primario iniciar sesión, secundario reenviar.
- ✅ Redirect automático tras verify success (5s) con contador + click manual.
- ✅ CTA en login para cuenta no verificada (`Ir a verificar cuenta`).
- ✅ Manejo de errores backend visible en formularios.
- ✅ Textos auth en español.
- ✅ Hook de éxito de signup para toast desde integrador (`onSignUpSuccess`).
- ✅ Soporte de selección de `role` en `sign up` (camelCase), con opciones por proyecto.
- ✅ `createAuthClientFromJBWebConfig` para construir auth client desde config central.
- ✅ Fallback de auth endpoint base path en `/authentication`.
- ✅ Flujo OTP mejorado: confirmación antes de solicitar, bloqueo de inputs tras envío, acción `Cambiar número`.
- ✅ Reorganización del módulo auth por dominios (`forms/sign-in`, `forms/sign-up`, `forms/password`, `forms/account`).
- ✅ Reorganización Fuse dentro de `auth/fuse/*` (sin archivos Fuse en raíz de `auth`).
- ✅ Backward compatibility en exports legacy (`JB*`) mientras se usan nombres más claros (`Auth*`) internamente.
- ✅ Integración SDK para nuevos endpoints del contrato: social login/link/unlink.
- ✅ Integración SDK para `PATCH /profile/picture/`.
- ✅ Integración SDK para `PATCH|PUT /account/update/` y `DELETE /account/delete/`.
- ✅ Integración SDK para perfiles por id (`GET|PATCH|DELETE /profiles/{id}/`) y creación (`POST /profiles/`).
- ✅ Integración SDK para bootstrap admin endpoints (`create-superuser`, `create-staff`).

## 🟡 En progreso
- 🟡 Convertir defaults temporales de testing a flag explícita (`enableTestDefaults`).
- 🟡 Homologar catálogo de mensajes/errores para i18n.
- 🟡 Hacer adopción de `createJBWebConfig` en proyectos consumidores existentes (primer wiring aplicado en Mentalysis).
- 🟡 Unificar parámetros auth para que salgan de config (`apiBasePath`, roles, default role).

## 🔜 Pendiente
- 🔜 Integración UI de Social Auth (botones/proveedores/callbacks).
- 🔜 Integración UI para gestión de cuenta (`account/update`, `account/delete`).
- 🔜 Integración UI para `profile picture`.
- 🔜 Layouts auth configurables (2-3 variantes por proyecto).
- 🔜 Tests de flujos críticos (login/signup/verify/reset/refresh).
- 🔜 Publicación versionada estable + guía de migración.

## 🚧 Riesgos / deuda técnica
- 🚧 Flujo de trabajo con paquete local `file:` requiere rebuild/reinstall frecuente.
- 🚧 Parte de la UI auth aún depende de convenciones Fuse y debe abstraerse más.
