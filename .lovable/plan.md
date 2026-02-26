

# Clara — Reestructuracion del Dashboard y Nuevas Funcionalidades

## Resumen

Transformar Clara de una app que "muestra datos" a una que **responde preguntas mentales** del usuario en 5 segundos. Los cambios se organizan en 3 fases para mantener estabilidad.

---

## Fase 1: Reestructurar el Home (Index.tsx)

### 1.1 — Nuevo bloque: "Tu posicion hoy" (Capital total)

Reemplazar las 3 cards actuales (Disponible / Deuda / Flujo) por un bloque unico protagonista:

- **Capital total** en grande (cuentas liquidas + inversiones - deudas)
- Debajo, 3 metricas en texto pequeno:
  - Disponible en banco: $X
  - Invertido: $X  
  - Deuda: -$X

### 1.2 — Bloque: "Este mes" (Flujo simple)

Fila horizontal con 3 datos:
- Ganado este mes: +$X
- Gastado este mes: -$X  
- **Te queda por gastar: $X** (presupuesto total - gasto actual)

Este "te queda" es el dato clave que hoy no existe.

### 1.3 — Bloque: "Pagos proximos"

Nuevo bloque mostrando pagos que vienen en los proximos 7-14 dias:
- Combina suscripciones proximas + fecha de pago de tarjetas de credito
- Formato: nombre + monto + fecha
- Reduce ansiedad mas que cualquier grafica

### 1.4 — Reemplazar grafica de linea por barra de presupuesto

Eliminar `LineChart` de recharts. Poner en su lugar:
- Una barra de progreso unica
- Texto: "Has usado 62% del presupuesto mensual"
- Colores segun semaforo (verde/amarillo/rojo)

### 1.5 — Quick Actions visibles

Debajo del capital total, 3 botones horizontales:
- Registrar (abre QuickAdd)
- Ajustar presupuesto (navega a /budgets)
- Actualizar balances (navega a /accounts)

El FAB flotante se mantiene como opcion secundaria.

### 1.6 — Mantener: Top 5 categorias y Ultimos movimientos
Se conservan tal cual, ya funcionan bien.

---

## Fase 2: Modulo de Inversiones

### 2.1 — Datos mock

Agregar a `mock-data.ts`:
- Interface `Investment` con: id, name, type (crypto/acciones/fondo/negocio), current_value, cost_basis, last_updated
- Array de inversiones mock (2-3 items)
- Actualizar `monthlyTotals` para incluir `invested` total

### 2.2 — Pantalla de Cuentas reorganizada

Reestructurar `Accounts.tsx` en 3 grupos:
- **Liquidez** (checking + savings) — total arriba
- **Credito** (tarjetas) — total deuda arriba
- **Inversiones** (nuevo) — total invertido arriba

Mostrar resumen en cabecera:
- Liquidez total: $X
- Deuda total: -$X
- Invertido total: $X

### 2.3 — Navegacion

Agregar "Inversiones" como seccion dentro de Cuentas (no pagina nueva), para no agregar complejidad de navegacion.

---

## Fase 3: Funcionalidades Faltantes

### 3.1 — Administracion de categorias

Nuevo componente `CategoryManager.tsx`:
- Accesible desde un boton "Administrar categorias" en la pantalla de Presupuestos
- Modal/drawer con lista de categorias
- Acciones: crear nueva, editar nombre/icono, desactivar
- Selector de emoji simple para iconos

### 3.2 — Presupuesto global editable

En `Budgets.tsx`, agregar arriba:
- Card con "Presupuesto mensual total": $X
- Boton para editar el total
- Calcular automaticamente "Te queda por gastar" desde aqui

### 3.3 — Insights accionables

En `Insights.tsx`, agregar botones contextuales a cada insight:
- "Ajustar presupuesto" -> navega a /budgets
- "Reducir categoria" -> navega a /budgets con filtro
- "Revisar gastos" -> navega a /transactions

### 3.4 — Quick Add: Enter para guardar

En `QuickAddTransaction.tsx`:
- Agregar `onKeyDown` handler para Enter en el campo de monto
- Focus automatico ya existe, solo falta el keyboard shortcut

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/mock-data.ts` | Agregar Investment interface, datos mock, actualizar monthlyTotals |
| `src/pages/Index.tsx` | Reestructurar completamente: capital total, flujo mensual, pagos proximos, barra presupuesto, quick actions |
| `src/pages/Accounts.tsx` | Reorganizar en grupos (liquidez/credito/inversiones) con totales |
| `src/pages/Budgets.tsx` | Agregar presupuesto global editable + boton administrar categorias |
| `src/pages/Insights.tsx` | Agregar botones de accion a cada insight |
| `src/components/QuickAddTransaction.tsx` | Enter para guardar |
| `src/components/CategoryManager.tsx` | **Nuevo** — Modal de administracion de categorias |

---

## Lo que NO se hace (intencionalmente)

- No se agregan mas graficas
- No se agregan mas filtros complejos
- No se agrega la funcionalidad de interpretar texto "250 tacos" (fase 2 AI)
- No se agrega transferencias entre cuentas (fase 2)
- No se conecta a backend real (esto seria siguiente paso con Lovable Cloud)

