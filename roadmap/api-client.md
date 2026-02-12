# API Client Roadmap

## ✅ Completado
- ✅ Cliente axios auth centralizado.
- ✅ Endpoints configurables por proyecto.
- ✅ Interceptor con manejo de 401 y refresh token.
- ✅ Normalización base de algunas respuestas (`emailSent`, etc.).

## 🟡 En progreso
- 🟡 Normalización de errores API en capa común.
- 🟡 Estándar de mapeo request/response por módulo.

## 🔜 Pendiente
- 🔜 Estrategia de retries/timeouts/cancelación por endpoint.
- 🔜 Telemetría opcional para debug de requests.
- 🔜 Tests de integración para refresh race conditions.

## 🚧 Riesgos / deuda técnica
- 🚧 Edge cases de sesión multi-tab y refresh concurrente.
