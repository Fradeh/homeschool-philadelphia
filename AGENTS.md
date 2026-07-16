# AGENTS.md

## Proyecto
Este proyecto se llama HomeSchool-Philadelphia. Es una plataforma educativa. El objetivo es construir un sistema funcional, limpio, seguro y mantenible.

## Estado actual
El proyecto tiene una base creada, pero todavía no está terminado. El frontend necesita mejorar y la persistencia con base de datos aún no está completa.

## Reglas generales
- No rehacer todo el proyecto sin autorización.
- No modificar muchos módulos al mismo tiempo.
- Antes de cambiar código, analizar la estructura actual.
- Mantener lo que ya funciona.
- No agregar dependencias nuevas sin justificar.
- No eliminar archivos sin explicar por qué.
- Priorizar flujos completos de punta a punta.
- Todo cambio debe indicar qué archivos fueron modificados y cómo probarlo.

## Prioridades actuales
1. Definir el MVP real del sistema.
2. Completar persistencia con base de datos.
3. Mejorar frontend de forma progresiva.
4. Conectar frontend, backend y base de datos.
5. Revisar autenticación, roles y seguridad.
6. Crear pruebas básicas.
7. Documentar instalación y uso.

## Agentes sugeridos
Cuando se pidan subagentes, usar estos roles:

### Agente Producto/MVP
Define qué módulos son obligatorios, cuáles pueden esperar y cuál debe ser el flujo principal del sistema.

### Agente Base de Datos/Persistencia
Revisa modelos, tablas, relaciones, CRUD, validaciones y conexión real con la base de datos.

### Agente Backend/API
Revisa endpoints, servicios, controladores, validaciones y lógica de negocio.

### Agente Frontend/UI
Revisa diseño visual, navegación, formularios, componentes reutilizables, estados vacíos, errores y responsive.

### Agente Integración
Verifica que frontend, backend y base de datos estén conectados correctamente.

### Agente Seguridad
Revisa autenticación, autorización, roles, protección de rutas, sesiones, archivos y datos privados.

### Agente QA
Revisa errores, casos borde, pruebas manuales y pruebas automatizadas posibles.