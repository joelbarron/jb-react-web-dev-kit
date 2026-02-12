# Core Roadmap

## ✅ Completado
- ✅ Exportaciones centralizadas por módulo para consumo simple.
- ✅ Integración con `FuseAuthProvider` y autorización por roles.
- ✅ Base para minimizar responsabilidad del proyecto consumidor.
- ✅ Estructura de carpetas auth simplificada y más mantenible (separación por dominio + fuse aislado).
- ✅ `createJBWebConfig` integrado como fuente real para `apiBasePath` y roles de signup en wiring de referencia.

## 🟡 En progreso
- 🟡 Reducir código puente restante en consumidores.
- 🟡 Fortalecer contratos de tipos públicos para evitar uso frágil.
- 🟡 Estandarizar `createJBWebConfig` como única fuente de verdad para auth/runtime settings.

## 🔜 Pendiente
- 🔜 API pública estable (v1) con manejo formal de breaking changes.
- 🔜 Matriz de compatibilidad (React, MUI, Router).
- 🔜 Plantilla de migración para que apps existentes dejen config hardcodeada de auth.

## 🚧 Riesgos / deuda técnica
- 🚧 Acoplamiento parcial a implementación específica de consumidores.
