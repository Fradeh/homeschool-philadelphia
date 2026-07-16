# QA Release Readiness

## Veredicto

| Nivel | Veredicto | Razón |
|---|---|---|
| Demo interna | **READY WITH KNOWN RISKS** | build/lint/tests normales y smoke PASS; rutas principales existen |
| Piloto | **NOT READY** | candidatos P1 de autorización/PACEs, E2E crítico incompleto, archivos sin validación integrada |
| Producción | **NOT READY** | no cumple 0 P1, E2E completo, roles cruzados, backups/observabilidad/despliegue ni storage externo verificado |

## Bloqueadores principales

1. Reproducir/cerrar QA-002 (posible acceso cruzado a grupos/posts/calendario).
2. Reproducir/cerrar QA-003 (Teacher de materia bloqueado en PACEs).
3. Ejecutar 52/52 Playwright tras corregir el contrato accesible de contraseña o mantener selector técnico documentado.
4. Verificar archivos end-to-end, material oculto y compensación storage/DB.
5. Resolver portales/redirects Director y Parent según alcance real.

## Criterios de producción

- P0: 0 observado.
- P1 abiertos/candidatos: existen; criterio incumplido.
- Admin/Teacher/Student críticos: no todos ejecutados en browser; incumplido.
- GCR: integridad DB parcial PASS, prueba API FAIL por fixture y browser pendiente; incumplido.
- Roles cruzados: suite creada, ejecución completa pendiente; incumplido.
- Build/lint: PASS.
- Consola crítica: pendiente recorrido completo.
- Responsive: suite creada en 4 tamaños, ejecución pendiente.
- Backups/despliegue/secretos: no definidos en repo; incumplido.

## Primera corrección recomendada (sin implementar)

Priorizar seguridad de groups/posts/calendar; luego PACEs por asignación de materia; después estabilizar el contrato accesible del login y ejecutar toda la suite; a continuación consistencia de storage/materiales y paginación medida de workspaces.
