# Plan de acción — Web app de monitoreo solar (mejor que Felicity)

> **Decisiones tomadas:** cobertura equilibrada (Energía + Batería + Finanzas + Salud),
> preparada para multi-planta, stack **Next.js (App Router)**.
> **Principio rector:** equilibrado en cobertura, JERÁRQUICO en cada vista. Una pregunta
> dominante por pantalla. Todo lo demás es progressive disclosure.

---

## 0. La filosofía (por qué la mayoría de los dashboards solares son malos)

Felicity (y casi todos) cometen 3 pecados:

1. **Muestran lo que el inversor reporta, no lo que el usuario se pregunta.** Te tiran
   `acTtlInPower`, `bmsChargingState` crudos. Al usuario no le importa el dato — le importa
   la **respuesta**: *"¿hoy me banqué solo o tiré de la red?"*, *"¿cuánta plata ahorré?"*.
2. **Confunden potencia (kW) con energía (kWh).** El 90% de los dueños no entiende la
   diferencia. Hay que hablar en humano.
3. **Sin contexto no hay significado.** "Generaste 12 kWh" no dice nada. *"Generaste 12 kWh,
   18% más que ayer y cubriste el 76% de tu consumo"* — eso sí.

Nuestra app se diseña al revés: **primero la pregunta del usuario → después el dato que la responde.**

### Jobs To Be Done (lo que tu usuario quiere "contratar" a la app)
1. *"¿Cómo viene mi día/mes? ¿Estoy mejor o peor que antes?"* → **Overview + comparativos**
2. *"¿Cuánta plata estoy ahorrando y cuándo recupero la inversión?"* → **Finanzas**
3. *"¿Qué tan independiente de la red soy?"* → **Autosuficiencia** (el diferencial de un híbrido)
4. *"¿Mi batería está sana o se está muriendo?"* → **Salud de batería**
5. *"¿Algo anda mal y todavía no me di cuenta?"* → **Alertas/anomalías proactivas**

---

## 1. Arquitectura de información (cómo se organiza)

```
┌─ OVERVIEW (la home) ─────────────────────────────┐
│  Selector de planta · estado · "último dato hace X"│
│  3-4 KPIs héroe (responden los JTBD del día)       │
│  Flujo de energía EN VIVO (mejorado)               │
│  Mini-tendencia del día + 1 insight automático     │
└────────────────────────────────────────────────────┘
        │ drill-down (progressive disclosure)
        ▼
┌─ ENERGÍA ─┐ ┌─ FINANZAS ─┐ ┌─ BATERÍA ─┐ ┌─ SALUD ─┐
│ de dónde  │ │ ahorro real│ │ SOH/ciclos│ │ score   │
│ salió cada│ │ payback    │ │ balance   │ │ alertas │
│ watt      │ │ vs tarifa  │ │ de celdas │ │ strings │
└───────────┘ └────────────┘ └───────────┘ └─────────┘
```

Regla de oro por pantalla: **1 pregunta dominante arriba (hero), detalle abajo.**

---

## 2. LOS GRÁFICOS Y DATOS (el corazón del pedido)

Marcados: 🆕 = lo que hoy NO tenés y es oro · 🔧 = lo que tenés pero hay que arreglar

### 2.1 Overview — los KPIs héroe

| KPI | Qué responde | Cómo se calcula (campos API) |
|-----|--------------|------------------------------|
| 🔧 **Generación hoy** | ¿Cuánto produje? | `eToday` (+ comparativo vs ayer/promedio) |
| 🆕 **Autosuficiencia hoy (%)** | ¿Cuánto de mi consumo lo cubrí yo? | `(eLoadToday − eGridInputToday) / eLoadToday` |
| 🆕 **Autoconsumo (%)** | ¿Cuánto de mi sol aproveché vs regalé a la red? | `(ePvToday − eGridFeedToday) / ePvToday` |
| 🔧 **Ahorro hoy ($)** | ¿Cuánta plata hice/ahorré? | autoconsumo·tarifa + `eGridFeedToday`·precio_feed |

> Estos 4 números responden el 80% de lo que mirás cada mañana. El resto es para cuando
> querés investigar.

### 2.2 Flujo de energía EN VIVO 🔧 (lo tenés pero se entiende mal)

- **Fuente:** `get_energy_flow2` + `get_device_snapshot`.
- **Problema actual:** signos confusos (¿la red entra o sale?), unidades que saltan, todo
  del mismo color.
- **Mejora:** diagrama PV → Casa / Batería / Red con:
  - **Color semántico fijo:** ☀️ amarillo = solar, 🔋 verde = batería, 🏠 azul = consumo,
    🔌 rojo = red (importando) / gris = red (exportando).
  - **Animación de partículas** en la dirección real del flujo (entra/sale).
  - **Etiquetas en humano:** "Tu casa consume 0.9 kW · 100% viene del sol".
  - Badge de **frescura del dato** ("hace 2 min", basado en `dataTimeStr`/`reportFreq`).

### 2.3 ENERGÍA — "¿De dónde salió cada watt?"

- 🆕 **Stacked area de cobertura de consumo (24h):** línea de consumo (`loadPower`) con
  relleno apilado por fuente (PV / batería / red) hora por hora. **Cuenta la historia de
  tu independencia visualmente.** Casi nadie lo hace. Fuente: `chart_storageRealtimeData_mate`
  con `timeDimension:"hour"`.
- 🆕 **Sankey diario de energía:** cuánta energía TOTAL fue PV→casa, PV→batería, PV→red,
  red→casa, batería→casa. El flujo en vivo muestra el instante; **el Sankey muestra el día
  entero** — es lo que de verdad explica tu sistema. Fuente: buckets `ePv*`, `eBatChar/DisChar*`,
  `eGridFeed*`, `eGridInput*`, `eLoad*`.
- 🔧 **Generación por período (día/mes/año):** barras con `timeDimension` día/mes/año.
  Mejora: comparativo overlay (este mes vs anterior vs mismo mes año pasado).
- 🆕 **Rendimiento por string/MPPT:** `pv1Power..pv10Power` (y `pv1Today..`) comparados.
  Si un string rinde consistentemente menos → sombra/suciedad/falla. **Mantenimiento predictivo.**

### 2.4 FINANZAS — la que más se pide y peor está hecha

- 🆕 **Ahorro real desglosado (no solo "income"):** Felicity te da `pvTodayIncome` asumiendo
  precio de venta. Pero tu ahorro real son DOS cosas distintas:
  - **Importación evitada** = autoconsumo · tu tarifa de compra (lo que NO le pagaste a la red)
  - **Venta a la red** = `eGridFeed` · precio de inyección
  - Mostralas separadas. La gente no entiende que ahorrar consumiendo vale más que vender.
- 🆕 **Curva de payback (recupero de inversión):** ahorro acumulado vs costo del sistema →
  proyección de **en qué fecha lo recuperás**. EL gráfico financiero que todo dueño quiere
  y ninguna app local muestra. Fuente: `accPvIncome` + ahorro calculado + costo (input del usuario).
- 🔧 **Ahorro mensual/anual:** barras con `monthPvIncome`/`yearPvIncome` + ahorro por autoconsumo.
- 🆕 **Equivalencias en humano:** "Este mes ahorraste = X facturas de luz / Y cafés / Z litros
  de nafta". Más `totalCo2Less`, `totalReduceDeforestation` (los tenés, úsalos en storytelling).

### 2.5 BATERÍA — el diferencial del híbrido (acá nadie llega)

- 🆕 **Salud (SOH) y degradación en el tiempo:** `battSoh` trackeado día a día → tendencia +
  proyección de vida útil restante. El dato más caro de tu sistema y nadie lo grafica.
- 🆕 **Ciclos y uso:** `batCycleIndex`, `batFullCount`, `wBattChgWh`/`wBattDCgWh` (energía
  cargada/descargada), `wBattRunTime`. "Llevás N ciclos de ~6000 de vida útil".
- 🆕 **Balance de celdas (early warning de falla):** `cellVolt1..cellVolt16` → spread entre la
  celda más alta y la más baja. Si una se despega → celda muriendo. `cellTemp1..8` para hotspots.
  **Esto es nivel ingeniería que ni Felicity te muestra claro** y predice fallas caras.
- 🆕 **Patrón de carga/descarga diario (heatmap):** SOC por hora a lo largo de los días.
  Ves si la batería llega a 100%, si se vacía de noche, si hay franjas raras. Fuente: `battSoc`
  histórico vía `list_storageRealtimeData_new`.
- 🆕 **Ventana óptima (insight accionable):** dado tu patrón + tarifa, "te conviene no descargar
  por debajo de X%" o "cargás tarde". Pasás de descriptivo a **prescriptivo**.

### 2.6 SALUD DEL SISTEMA — alertas proactivas

- 🆕 **Health Score (0-100):** un número que combina online/offline, fallas (`faultStatus`,
  `failCode`, `warningCount`), señal wifi (`wifiSignal`), temperaturas, balance de celdas,
  gaps de datos. Un semáforo que mirás y sabés si tenés que preocuparte.
- 🆕 **Timeline de eventos:** caídas, fallas, picos de temperatura, días que no cargó full.
- 🆕 **Alertas inteligentes (no solo las del fabricante):**
  - "Tu generación cayó 30% sin cambio de clima" (posible suciedad/sombra/falla).
  - "String 2 rinde 18% menos que el 1 hace 5 días."
  - "La batería no llegó a 100% en 3 días."
  - "Inversor offline hace 2 h."
- 🔧 **Temperaturas:** `tempMax`, `mosTemp`, `pvTemp`, `battPositiveTemp` con rangos seguros
  claros (hoy son números sin contexto).

### 2.7 Transversal — comparativos y contexto (matan la confusión actual)

- 🆕 **Deltas siempre visibles:** todo número grande lleva su "▲ 18% vs ayer". Sin comparación
  no hay significado.
- 🆕 **Normalización por clima:** `getPlantClimateVo` para mostrar "generación esperada vs real".
  Un día nublado con poca generación NO es una alarma; un día soleado con poca generación SÍ.
- 🆕 **Rendimiento específico (kWh/kWp):** `eToday / ratedPower`. Normaliza por tamaño del
  sistema → comparás días distintos de forma justa y contra benchmarks.
- 🆕 **Racha de autarquía (engagement):** "12 días seguidos cubriendo +70% de tu consumo. Récord: 19."

---

## 3. Mapa dato → endpoint (de dónde sale cada cosa)

| Necesidad | Endpoint | Cadencia |
|-----------|----------|----------|
| KPIs y meta de planta | `POST /plant/plantDetails` | cada ~5 min / on-load |
| Telemetría en vivo (⭐ todo) | `POST /device/get_device_snapshot` | = `reportFreq` (~5 min) |
| Flujo en vivo | `GET /device/get_energy_flow2` | ~5 min |
| Series para gráficos | `POST /storageRealtimeData/chart_storageRealtimeData_mate` (`timeDimension`) | on-demand, cacheable |
| Histórico paginado | `POST /storageRealtimeData/list_storageRealtimeData_new` | on-demand, cacheable duro |
| Clima | `POST /plant/getPlantClimateVo` | cada hora |
| Lista de plantas (multi) | `POST /plant/list_plant` | on-load |
| Lista de dispositivos | `POST /device/list_condition_device` | on-load |
| Auth | `POST /userlogin` (RSA, ver API_FELICITYSOLAR.md) | al expirar (~30 días) |

> Detalle completo de auth, headers y payloads en **`API_FELICITYSOLAR.md`**.

---

## 4. Arquitectura front-end (Next.js App Router) — best practices

### 4.1 BFF / proxy (resuelve CORS Y seguridad de un saque)
- **Route Handlers** (`app/api/felicity/...`) que hablan con `shine-api.felicitysolar.com`
  **server-side**. El browser nunca ve la API de Felicity ni el token.
- **El token y las credenciales viven en el server** (sesión httpOnly cookie / env). NUNCA
  en el cliente. Re-login automático al expirar (~30 días).
- Esto **elimina el problema de CORS** que documentamos (la API solo permite el origin de
  Felicity) y no expone secretos. Es la razón #1 para elegir Next sobre una SPA pura.

### 4.2 Capa de datos
- **Server Components** para el fetch inicial (plantDetails, listas) → first paint rápido,
  sin secretos en el bundle.
- **TanStack Query (React Query)** en cliente para lo que se refresca (snapshot en vivo):
  caching, retries, `staleWhileRevalidate`, polling.
- **Polling respetuoso:** poleá el snapshot a la cadencia que el inversor reporta
  (`reportFreq`/`updateInterval`, ~5 min). **Anti-patrón:** machacar cada segundo — no hay
  dato nuevo y le pegás de más a la API.
- **Caching por tipo de dato:** histórico = inmutable → cache duro (cache tags de Next).
  Datos de hoy = TTL corto. Catálogos (países, etc.) = cache larga.

### 4.3 Estado y URL
- **URL como fuente de verdad** para planta seleccionada y rango de fechas (`searchParams` /
  `nuqs`). Vistas compartibles, server-renderizables, back/forward funciona.
- Nada de Redux para esto. Server state = React Query; UI state = useState/Context puntual.

### 4.4 Gráficos — recomendación
- **Apache ECharts** (`echarts-for-react`) para lo pesado: **Sankey**, series temporales
  grandes con zoom, gauges, heatmaps. Felicity ya usa ECharts → sabemos que aguanta estos datos,
  y maneja Sankey nativo (Recharts no). Performante con miles de puntos.
- **Recharts/Visx** opcional para gráficos simples si querés algo más liviano y declarativo.
- Regla: **una sola librería de charts pesada** para no inflar el bundle.

### 4.5 Design system y UX
- **Tailwind + shadcn/ui (Radix)** → accesible por default, rápido de componer, tokens de diseño.
- **Color semántico de energía consistente** en TODA la app (solar/batería/red/consumo). Es
  identidad visual Y función (el usuario aprende a leer de un vistazo).
- **Dark mode** (las apps solares se miran de noche también) + paleta **color-blind safe**.
- **Skeletons** y estados de carga/vacío/error de primera (no spinners genéricos).
- **Mobile-first:** lo vas a mirar del celu. Charts que se adaptan, no que se rompen.

### 4.6 Accesibilidad y performance
- Charts con **alternativa textual / tabla de datos** y navegación por teclado.
- `prefers-reduced-motion` (apagar animaciones de flujo).
- **Code-splitting** de charts (dynamic import), **virtualización** de tablas históricas
  largas, **memoización** de KPIs derivados, web worker si la agregación pesa.

### 4.7 Resiliencia (la diferencia entre demo y producto real)
- Manejar **inversor offline** y **dato viejo** con badge claro ("último dato hace 2 h"),
  no mostrar 0 como si fuera real.
- Validar el envelope `{ code, message, data }` — `code !== 200` es error de negocio aunque
  el HTTP sea 200.
- Datos parciales/`null` por todos lados en el snapshot → capa de **normalización** que
  convierte strings/null a números seguros y unifica unidades antes de tocar la UI.

---

## 5. Roadmap por fases (orden de ataque)

### Fase 0 — Cimientos (sin esto no hay nada)
- BFF proxy + auth/sesión server-side + re-login automático.
- Capa de normalización de datos (unidades, null-safety, derivados).
- Design system base (tokens, colores de energía, layout, dark mode).
- Modelo multi-planta + selector + rutas `/[plantId]`.

### Fase 1 — MVP que ya se siente mejor que Felicity
- Overview con los 4 KPIs héroe (incluida **autosuficiencia** 🆕).
- Flujo de energía en vivo mejorado 🔧.
- Stacked area "de dónde salió cada watt" 🆕.
- Ahorro real desglosado 🆕.
- Comparativos básicos (vs ayer / mes anterior).

### Fase 2 — Profundidad
- Pantalla Batería: SOH/degradación, ciclos, **balance de celdas** 🆕, heatmap de SOC.
- Sankey diario 🆕.
- Rendimiento por string/MPPT 🆕.
- Finanzas: **curva de payback** 🆕 + equivalencias.

### Fase 3 — Inteligencia (lo que te hace único)
- Health Score + timeline + **alertas inteligentes** 🆕.
- Normalización por clima (esperado vs real) 🆕.
- Insights prescriptivos de batería (ventana óptima) 🆕.
- Racha de autarquía / gamificación 🆕.

---

## 6. Validación de la API (HECHA) — qué es posible y qué no

> Probado en vivo desde Node contra la planta real. Resultados:

### ✅ Confirmado
- **Resolución: 5 minutos.** Tanto `chart_storageRealtimeData_mate` (dataTime
  `00:00, 00:05, ..., 23:50`) como el histórico crudo `list_storageRealtimeData_new`
  (~288 filas/día). Resolución excelente para todos los gráficos intradía.
- **Retención: desde la instalación, SIN límite artificial.** El histórico crudo
  devuelve días de feb/mar/may 2026 (install 2026-02-11). Fechas previas a la instalación
  → vacío (lógico). O sea: **tenés toda tu historia disponible.**
- **Histórico crudo MUY rico: 377 campos por fila, cada 5 min.** Permite reconstruir casi
  cualquier stat hacia atrás (PV por string, consumo, flujos, temperaturas).

### ⚠️ Gotchas que cambian el diseño (importante)
1. **Agregación mensual/anual NO la sirve este endpoint** — solo intradía 5-min. Los totales
   `eMonth/eYear/eTotal` vienen en snapshot/plantDetails como acumulados, pero "generación por
   día del mes" o "por mes del año" hay que **derivarla nosotros** (o buscar un endpoint de
   estadística dedicado, aún no capturado).
2. **Nombres de campos del histórico ≠ snapshot.** En el histórico se usan `pvElectricity,
   gridInput, feedOutput, batteryCharging, batteryDischarge, loadConsumption` (no `loadPower`,
   `eToday`, etc.). La capa de normalización tiene que mapear ambos esquemas.
3. **Nulos y gaps.** Campos como `battSoc` vinieron `null` en filas históricas, y algunos días
   tienen huecos de datos. El `chart_*` fue inconsistente en fechas viejas mientras el histórico
   crudo SÍ tenía filas → **el histórico crudo es la fuente confiable; el chart, para hoy/recientes.**
4. **`battSoh` (salud de batería) probablemente NO esté en el histórico** → para graficar
   degradación en el tiempo necesitás **guardarlo vos** día a día.

### 🏗️ CONSECUENCIA ARQUITECTÓNICA (la decisión grande)
Los puntos 1 y 4 lo dejan claro: **la app necesita su PROPIA base de datos de series de tiempo.**
No alcanza con leer Felicity en vivo. Hay que:
- **Job de ingesta** (cron en el server) que cada ~5 min snapshotea el inversor y persiste.
- **DB time-series** (Postgres + TimescaleDB, o similar) como fuente de verdad propia.
- Sobre esa DB calculamos: agregados mensuales/anuales, tendencia de SOH, comparativos
  históricos, rachas, baselines para detección de anomalías.

Beneficios: independencia de la inconsistencia de Felicity, queries rápidas, y habilita los
stats 🆕 que dependen de historia larga (SOH, payback, anomalías). **Esto agranda el alcance:
ya no es solo front-end, es front + un backend de ingesta.** Es la decisión correcta igual —
sin DB propia, media docena de los gráficos más valiosos no son posibles.

### SOC histórico → RESUELTO ✅
El SOC de la batería SÍ está en el histórico, pero bajo **`emsSoc`** (no `battSoc`, que viene
null). Validado: 100/100 filas con dato (ej. `26,25,24,22,21...` descargándose de noche). →
**el heatmap de SOC retroactivo ES posible.** En cambio **`emsSoh` viene en 0 en el histórico**
→ la tendencia de salud (SOH) hay que capturarla nosotros desde la ingesta.

> Lección de normalización: en vivo el SOC es `battSoc`/`battSoh`; en histórico es
> `emsSoc`/`emsSoh`. La capa anti-corrupción mapea ambos a un campo canónico `soc`/`soh`.

### Pendiente menor
- Buscar endpoint de estadística mensual/anual nativo (ahorraría derivar; igual lo resolvemos
  con la DB propia).

### Inputs del usuario (no vienen de la API)
- **Tarifa de compra, precio de inyección y costo del sistema** → onboarding simple. La API
  solo trae `electricityPrice` genérico; el payback y el ahorro real preciso los necesita.

---

---

## 7. Fase 0 en detalle — ingesta + modelo de datos

> Validado que necesitamos DB propia. Acá el diseño concreto para arrancar.

### 7.1 Arquitectura
```
Felicity API ──(BFF/proxy, server-side)──┐
                                          ▼
        ┌─────────────────────────────────────────────┐
        │  Capa anti-corrupción (1 módulo)             │
        │  - login RSA + manejo de token (~30d)        │
        │  - normaliza esquemas live/histórico → canon │
        └───────────────┬──────────────┬───────────────┘
                        │              │
            (cron ~5min)│              │(on-demand, hoy)
                        ▼              ▼
                 ┌────────────┐   Next Route Handlers
                 │  Ingesta   │   (sirven al frontend)
                 │  worker    │        │
                 └─────┬──────┘        ▼
                       ▼          React (RSC + React Query)
              ┌──────────────────┐
              │ Postgres+Timescale│ ← fuente de verdad propia
              └──────────────────┘
```

### 7.2 Ingesta
- **Worker/cron cada 5 min** (alineado al `reportFreq` del inversor) que llama
  `get_device_snapshot` por cada dispositivo de cada planta y persiste.
- **Backfill inicial:** al dar de alta una planta, recorrer `list_storageRealtimeData_new`
  página por página desde la fecha de instalación → cargar TODA la historia de un saque.
- **Idempotencia:** upsert por `(device_sn, ts)` para no duplicar si se solapa.
- **Tolerancia a fallos:** reintentos, marcar gaps, no romper si el inversor está offline.

### 7.3 Modelo de datos (Postgres + TimescaleDB)
No persistas los 377 campos — quedate con los ~40 que alimentan los stats. Esquema base:

```sql
-- metadata
plants(id, felicity_plant_id, name, org_code, country, tz, install_date,
       rated_power_w, system_cost, buy_tariff, feed_tariff, currency)
devices(id, plant_id, device_sn, model, device_type, rated_power_w)

-- HYPERTABLE: telemetría 5-min (la tabla caliente)
telemetry(
  device_sn, ts,                      -- PK compuesta (hypertable por ts)
  pv_power_w, pv1_power_w..pv4_power_w,
  load_power_w, grid_in_power_w, feed_power_w,
  batt_charge_w, batt_discharge_w,
  soc_pct,                            -- ← emsSoc (histórico) | battSoc (vivo)
  batt_volt, batt_curr,
  ac_out_power_w, ac_out_volt, ac_out_freq,
  temp_max, mos_temp, pv_temp,
  e_today_kwh, e_pv_today_kwh, e_load_today_kwh,
  e_grid_in_today_kwh, e_grid_feed_today_kwh, e_bat_char_today, e_bat_dischar_today
)  -- TimescaleDB hypertable + compresión para datos > 7 días

-- rollup diario (continuous aggregate de Timescale, auto-actualizado)
daily_stats(
  device_sn, day,
  e_pv_kwh, e_load_kwh, e_grid_in_kwh, e_grid_feed_kwh,
  e_bat_char_kwh, e_bat_dischar_kwh,
  self_sufficiency_pct, self_consumption_pct,   -- ← derivados, el oro
  savings, feed_income, peak_pv_w, min_soc, max_soc
)

-- salud (cambia lento, snapshot diario — el histórico NO lo trae)
health_snapshots(
  device_sn, day,
  soh_pct,                            -- ← capturado por nosotros (emsSoh=0 en histórico)
  cycle_index, full_count,
  cell_volt_spread_mv, cell_temp_max, fault_code, warning_count, wifi_signal
)
```

**Por qué Timescale:** `telemetry` crece ~288 filas/día/dispositivo → con
**continuous aggregates** los rollups diarios/mensuales se mantienen solos (resuelve el gotcha
de "la API no agrega mensual"), y la **compresión** mantiene la tabla chica. Las queries de los
gráficos pegan a `daily_stats`/`health_snapshots` (rápidas), no a la tabla cruda.

### 7.4 Capa de normalización (mapeo canónico)
Un solo módulo traduce ambos esquemas de Felicity a nuestros campos. Ejemplos críticos:
| Canónico | Vivo (snapshot) | Histórico (list) |
|----------|-----------------|------------------|
| `soc_pct` | `battSoc` | `emsSoc` |
| `soh_pct` | `battSoh` | *(no fiable → captura propia)* |
| `pv_power_w` | `pvTotalPower` | `pvElectricity` |
| `load_power_w` | `loadPower` | `loadConsumption` |
| `grid_in_power_w` | `acTtlInPower`/`gridInputPower` | `gridInput` |
| `feed_power_w` | `feedPower` | `feedOutput` |
| `batt_charge_w` | `batteryCharging` | `batteryCharging` |

> Todo string/null se castea a número seguro acá, no en la UI. La UI recibe datos limpios.

### 7.5 Entregables Fase 0
1. BFF proxy + login RSA + manejo de sesión/token server-side.
2. Capa anti-corrupción con el mapeo canónico (tabla de arriba).
3. Schema Timescale + migraciones.
4. Worker de ingesta 5-min + backfill desde instalación.
5. Continuous aggregates para `daily_stats`.
6. Modelo multi-planta + onboarding (tarifas y costo del sistema).
7. Design system base (tokens, colores de energía, dark mode, layout).

Con esto, las Fases 1-3 ya consultan NUESTRA DB (rápida, completa, confiable) en vez de
pelearse con la API en cada gráfico.

---

*Plan basado en datos reales validados en vivo (ver `API_FELICITYSOLAR.md`). Próximo paso:
arrancar la Fase 0 — montar BFF + ingesta + DB.*
