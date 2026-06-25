# Guía de decisiones técnicas y de negocio

Este documento explica por qué el código está escrito como está,
qué pasa si cambias algo, y qué riesgos tiene cada parte.
No es un tutorial — asume que ya leíste el README.

---

## Base de datos: por qué tres capas (raw / clean / gold)

La separación no es burocracia. Cada capa tiene un contrato diferente:

**raw** recibe los CSV exactamente como llegan de Olist. No transforma nada, no valida nada.
Si en el futuro Olist cambia el formato de sus CSV, solo tienes que tocar el ETL hasta clean —
el gold y el API quedan intactos. Esto es especialmente valioso si ya tienes dashboards
o reportes corriendo sobre gold: un cambio en la fuente no los rompe.

**clean** es donde vive la lógica de calidad de datos: convertir strings a timestamps,
manejar valores vacíos, agregar pagos por orden. Si cambias una regla de limpieza aquí
(por ejemplo, empezar a excluir órdenes sin fecha de compra), ese cambio se propaga
automáticamente a gold la próxima vez que corras el ETL.

**gold** es el contrato con el negocio. Sus tablas y métricas son lo que el API expone.
Deberían cambiar solo cuando el negocio decide redefinir un KPI, no cuando cambia un CSV.

Si en algún momento alguien pregunta "¿por qué GMV subió esta semana?",
puedes ir a raw, ir a clean y rastrear exactamente qué datos entraron.
Con una sola tabla eso es imposible.

---

## El ETL: qué pasa si lo corres dos veces

Es idempotente: hace TRUNCATE de raw antes de cada COPY, y TRUNCATE de gold antes de rebuild.
Puedes correrlo cuantas veces quieras y siempre terminas con los mismos datos.

Lo que NO es idempotente: si tienes datos en producción que fueron editados manualmente
en gold (por ejemplo, correcciones manuales de un KPI), el ETL los borra. Gold está diseñado
para ser 100% derivado de clean — si necesitas correcciones manuales, hazlas en clean.

Si el ETL falla a la mitad (por ejemplo, se cae la conexión durante clean → gold),
los datos en gold quedan incompletos porque el TRUNCATE ya corrió. Solución: envolver
el ETL en una transacción. Esto no está implementado actualmente — es el siguiente paso
natural si este dashboard va a producción.

---

## Arquitectura hexagonal: por qué importa para negocio

La estructura de carpetas (domain / application / infrastructure / adapters) no es decorativa.

Los `use cases` en `src/application/` son los que tienen la lógica de validación de negocio:
que `from` sea antes que `to`, que `limit` esté entre 1 y 100, que `grain` sea day o week.
Esto vive ahí y no en el controller porque esas son reglas de negocio, no reglas HTTP.

Si en 6 meses decides migrar de Express a Fastify, o de Prisma a TypeORM,
los use cases no cambian. Solo reescribes los adaptadores.

Si el negocio decide que el límite máximo de productos en el ranking debe ser 50 en lugar de 100,
el cambio es en `GetTopProducts.ts` línea donde dice `MAX_LIMIT = 100`. Un lugar, un cambio.

Si el cambio lo hicieras en el controller o en el DTO (Zod schema), estarías mezclando
responsabilidades: la regla de negocio estaría acoplada al transporte HTTP.

---

## `payment_value_allocated`: la decisión más importante de modelado

Olist guarda los pagos a nivel de orden, no de ítem. Pero el grano de nuestra fact es el ítem.
Hay tres formas de manejar esto:

1. **Proporcional por precio** (lo que implementamos): cada ítem recibe un porcentaje del pago
   igual a su peso en el precio total de la orden. Es la asignación más justa y la más intuitiva.

2. **Distribución igualitaria**: dividir el pago entre el número de ítems.
   Rápido de implementar, pero distorsiona el revenue de productos baratos vs caros.

3. **No alocar**: dejar payment_value solo a nivel de orden y no en la fact.
   Esto obligaría a hacer un JOIN extra en cada query del API y complicaría los filtros.

La opción 1 implica que si una orden tiene un descuento, ese descuento se distribuye
proporcional al precio — lo cual es lo que la mayoría de plataformas de analytics usan.

El riesgo: si hay órdenes donde `SUM(item_price) = 0` (datos corruptos), dividimos por cero.
El código maneja esto con un CASE WHEN que devuelve 0 en ese escenario.

---

## `is_canceled` incluye `unavailable`

En Olist, `unavailable` significa que el producto no tenía stock cuando se procesó la orden.
Desde el punto de vista del cliente, la diferencia con `canceled` es mínima: no recibió el producto.

Si el negocio decide separar estos dos casos (por ejemplo, para distinguir cancelaciones
voluntarias de fallas de inventario), el cambio es en `005_clean_to_gold.sql`:

```sql
-- Actual:
o.order_status IN ('canceled', 'unavailable') AS is_canceled

-- Si quieres solo cancelaciones voluntarias:
o.order_status = 'canceled' AS is_canceled
```

Ese único cambio modifica la Cancellation Rate y los KPIs derivados.
No necesitas tocar el API ni el frontend.

---

## Seguridad: qué está protegido y qué no

**Protegido:**
- SQL injection: `Prisma.$queryRaw` con template literals escapa automáticamente los parámetros.
  Nunca concatenamos strings de usuario en SQL.
- Validación de inputs: todos los query params pasan por Zod antes de llegar al use case.
  Un parámetro inválido devuelve 400 con el detalle del error, nunca llega a la base de datos.
- Credenciales: viven en variables de entorno, no en el código.
- Los archivos CSV están montados como `:ro` (read-only) en Docker.

**No protegido (y debería serlo antes de ir a producción):**
- CORS está en `*` en `src/index.ts`. En producción, reemplazar por el dominio específico del frontend.
- No hay rate limiting. Un script podría hacer miles de requests al `/kpis`. Agregar `express-rate-limit`.
- No hay autenticación. Este dashboard asume que quien tiene la URL tiene permiso. Si los datos
  de ventas son sensibles (y en un e-commerce real lo son), agregar auth antes de exponer esto.
- El usuario de Postgres es `postgres` (superuser). En producción, crear un usuario con permisos
  solo de lectura sobre el schema `gold` y de escritura solo sobre `raw` y `clean`.
- No hay HTTPS en Docker Compose. En producción, poner un reverse proxy (nginx o Traefik) con TLS.

---

## Los tests: qué cubren y qué no

Los tres tests unitarios verifican la lógica de los use cases: validaciones de fecha,
validaciones de parámetros, que el use case llame al repositorio con los filtros correctos.
No tocan la base de datos.

El test de integración verifica los endpoints HTTP mockeando Prisma.
Esto cubre que el routing, la validación Zod y el controller funcionan juntos.
Lo que NO cubre: que las queries SQL en los repositorios devuelvan los resultados correctos.

Para cubrir eso necesitarías un test de integración con una base de datos real (test DB).
Es el paso natural siguiente. En ese test, cargarías datos conocidos, consultarías el API
y verificarías que los KPIs son los esperados.

---

## Prisma: por qué usamos `$queryRaw` en vez de los métodos ORM

Los KPIs requieren agregaciones complejas: SUM con GROUP BY, COUNT DISTINCT, JOINs a múltiples
tablas de dimensión. El ORM de Prisma está diseñado para CRUD de registros individuales,
no para analytics. Forzar esas queries a través del ORM generaría SQL ineficiente
o directamente no sería posible expresarlas.

`$queryRaw` con `Prisma.sql` nos da:
- SQL explícito y legible (útil para debuggear performance)
- Parámetros escapados automáticamente (seguridad)
- Tipos TypeScript en el resultado (podemos definir la interfaz del resultado)

El tradeoff: si alguien cambia el nombre de una columna en gold, el TypeScript no te avisa
hasta runtime. Por eso los nombres de columna en los repositorios deben mantenerse
sincronizados con el SQL de `005_clean_to_gold.sql`.

---

## El frontend: por qué no usamos React Query ni SWR

Los hooks de `useKpis`, `useTrend` y `useProducts` usan `useEffect + fetch` directamente.
Es más código que SWR (menos de 10 líneas extra), pero sin dependencias adicionales,
sin configuración global, y más fácil de explicar.

Si el dashboard crece (más páginas, datos que se actualizan en tiempo real, caché compartida
entre componentes), ahí sí vale la pena introducir SWR o React Query.
Por ahora sería over-engineering.

---

## Decisiones de modelado que podrían cambiar

**Si Olist actualiza el dataset con más órdenes:**
Solo corres `npm run etl` de nuevo. El ETL es idempotente.

**Si quieres agregar un nuevo KPI (por ejemplo, Average Delivery Time):**
1. Agregar el campo en `KpiResult.ts` (domain entity)
2. Agregar el cálculo SQL en `PrismaKpiRepository.ts`
3. El use case y el controller no cambian
4. Agregar la tarjeta en `page.tsx`

**Si quieres un tercer filtro (por ejemplo, por tipo de pago):**
1. Agregar el campo en `IKpiRepository.ts` y el resto de ports
2. Agregar el parámetro en los Zod schemas de `FilterParams.ts`
3. Agregar la condición SQL en los tres repositorios
4. Agregar el select en `FiltersPanel.tsx`

**Si quieres cambiar el grano de la fact de ítem a orden:**
Esto es un cambio mayor. El SQL de `005_clean_to_gold.sql` cambia completamente,
`payment_value_allocated` ya no necesita ser calculado, y `Items per Order`
desaparecería como KPI (o tendría que calcularse de otra forma).
No hagas este cambio a la ligera — el grano actual es el más flexible para analytics.

---

## Compliance: datos de Olist

El dataset de Olist está publicado bajo licencia CC BY-NC-SA 4.0.
- Puedes usarlo para proyectos personales, educativos y de investigación.
- No puedes usarlo para productos comerciales sin permiso.
- Los datos de clientes están anonimizados — no hay nombres ni emails reales.
- Si trabajas con datos reales de clientes (no el dataset de Olist), aplica LGPD (Brasil)
  o GDPR dependiendo de la jurisdicción, y necesitarás cifrado en reposo, logs de acceso,
  y un mecanismo de eliminación de datos.
