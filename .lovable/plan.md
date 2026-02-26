
# Filtro por cuenta en Transacciones + Correccion del historial de importaciones

## Resumen
Dos cambios: (1) Agregar burbujas de filtro por cuenta debajo del filtro de tipo (Gastos/Ingresos/Transferencias) para poder ver movimientos de una cuenta especifica. (2) Corregir el historial de importaciones que no muestra registros porque las importaciones anteriores se hicieron antes de que existiera la tabla `statement_imports`.

---

## 1. Filtro por cuenta en la pagina de Transacciones

### Comportamiento
- Debajo de las burbujas de tipo (Todos, Gastos, Ingresos, Transferencias), aparece una segunda fila de burbujas con las cuentas del usuario
- La primera opcion es "Todas" (sin filtro de cuenta)
- Las demas opciones son las cuentas registradas: BBVA, Hey Banco, Mercado Pago, etc.
- Al seleccionar una cuenta, la lista se filtra para mostrar solo movimientos de esa cuenta
- El filtro de cuenta funciona en combinacion con el filtro de tipo (ej: "Gastos" + "BBVA Bancomer" = solo gastos de BBVA)
- El balance del periodo se recalcula segun los filtros activos

### Cambios en `src/pages/Transactions.tsx`
- Nuevo estado `selectedAccount` (default: `'all'`)
- Obtener la lista de cuentas desde `useAppData()`
- Renderizar una fila de burbujas con estilo identico a las de tipo
- Aplicar el filtro de cuenta al array `filtered` ademas del filtro de tipo

---

## 2. Correccion del historial de importaciones

### Problema
La tabla `statement_imports` se creo despues de que el usuario ya habia importado estados de cuenta. Por eso la tabla esta vacia y el historial muestra "Aun no has importado ningun estado de cuenta".

### Solucion
- Mejorar el manejo de errores en el insert de `statement_imports` dentro de `StatementImporter.tsx` para que si falla, al menos se muestre un log y no falle silenciosamente
- Agregar `user_id` de forma mas robusta usando `auth.uid()` default en la columna (actualmente se pasa manualmente)
- Lo mas importante: verificar que el flujo de insercion funcione correctamente para futuras importaciones. Los imports anteriores no se pueden recuperar retroactivamente ya que no se guardo esa informacion

### Cambios en `src/components/StatementImporter.tsx`
- Agregar `.then()` / logging al insert de `statement_imports` para detectar errores futuros

### Cambios en `src/components/StatementHistory.tsx`  
- Mejorar el mensaje vacio para que sea mas claro: indicar que solo se muestran importaciones realizadas despues de activar esta funcion

---

## Detalle tecnico

### Transactions.tsx - Filtro por cuenta
```text
Estado actual:             Estado nuevo:
[Todos][Gastos]...         [Todos][Gastos]...
                           [Todas][BBVA][Hey Banco][MP]...
[Balance del periodo]      [Balance del periodo]
[Lista de movimientos]     [Lista filtrada]
```

- Se agrega `const { transactions, accounts } = useAppData()` (accounts ya no se importa solo transactions)
- Nuevo estado: `const [accountFilter, setAccountFilter] = useState<string>('all')`
- Filtro combinado: primero por tipo, luego por cuenta
- Las burbujas de cuenta usan el mismo estilo visual que las de tipo

### StatementImporter.tsx
- El insert a `statement_imports` se envuelve con mejor manejo de errores (log + no bloquear el flujo principal)
