# API Felicity Solar (Shine / Fsolar Intelligent Monitoring Platform)

> Documento de ingeniería inversa de la API que usa el frontend
> `https://shine.felicitysolar.com`. Hecho a partir de la captura real de tráfico
> (HAR de 445 requests) de la cuenta propia `ivangreve@gmail.com`.
> **Verificado end-to-end desde Node puro** (sin navegador): login + endpoint
> autenticado devuelven `code: 200`.

---

## 1. Datos base

| Cosa | Valor |
|------|-------|
| **Frontend (SPA)** | `https://shine.felicitysolar.com` |
| **API base** | `https://shine-api.felicitysolar.com` |
| **Formato** | JSON (`Content-Type: application/json`) |
| **Stack frontend** | Vue 3 + Element Plus + axios + JSEncrypt |

### Envelope de respuesta

**TODAS** las respuestas vienen con esta forma:

```json
{
  "code": 200,
  "message": "Éxito",
  "data": { ... }
}
```

- `code: 200` = éxito. Otros códigos = error (el mensaje viene en `message`).
- El `message` está en el idioma del header `lang` (acá `es_ES`).
- En listados, `data` suele traer `{ "list": [...], "total": N, "pageNum": 1, "pageSize": 10 }`.

---

## 2. Autenticación (LO IMPORTANTE)

### 2.1 La contraseña va ENCRIPTADA con RSA

🚨 El campo `password` **NO se manda en texto plano**. El frontend lo encripta con
**RSA-2048, padding PKCS#1 v1.5** (la librería `JSEncrypt`, default) usando esta
**clave pública hardcodeada** en el bundle JS:

```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnAJE68pjWZmtSg6ZJs9FZugJXC6bBSluTW6mJttOLOaljrdErVnM5DNN+YFzpB9pAysTErjY1bnSVuEwQSwptnqUji7Ch2qMj2n+0eCp8p6vtSh7/tFr2ul8nDRtkoswLANAIwtUk/G85ipMpmY1W642LImnEJmGkkddlbjbjxJTZWR5hc/d9cPWb+AR77LxFFrMik3c+44v1kQlIPFP6EjIbOvt/Lv7fHWD9JI/YzN4y1gK7C/VQdNGuikQyNg+5W3rg9ecYf9I5uLAQwY/hxeI3lbNsErebqKe2EbJ8AwcNIC0lDBz53Sq0ML89QapEuy3fB+upuctxLULVDCbNwIDAQAB
```

Como PEM (formato X.509 SubjectPublicKeyInfo):

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnAJE68pjWZmtSg6ZJs9F
ZugJXC6bBSluTW6mJttOLOaljrdErVnM5DNN+YFzpB9pAysTErjY1bnSVuEwQSw
ptnqUji7Ch2qMj2n+0eCp8p6vtSh7/tFr2ul8nDRtkoswLANAIwtUk/G85ipMpm
Y1W642LImnEJmGkkddlbjbjxJTZWR5hc/d9cPWb+AR77LxFFrMik3c+44v1kQlI
PFP6EjIbOvt/Lv7fHWD9JI/YzN4y1gK7C/VQdNGuikQyNg+5W3rg9ecYf9I5uLA
QwY/hxeI3lbNsErebqKe2EbJ8AwcNIC0lDBz53Sq0ML89QapEuy3fB+upuctxLU
LVDCbNwIDAQAB
-----END PUBLIC KEY-----
```

> Nota: RSA PKCS#1 v1.5 usa relleno aleatorio → el ciphertext cambia en cada
> ejecución. Es normal. El servidor lo desencripta con su clave privada igual.

### 2.2 Login

```
POST /userlogin
Content-Type: application/json
lang: es_ES
source: WEB
```

Body:

```json
{
  "userName": "ivangreve@gmail.com",
  "password": "<password encriptado RSA → base64>",
  "version": "1.0"
}
```

Respuesta (recortada):

```json
{
  "code": 200,
  "message": "Éxito",
  "data": {
    "id": "11463597805568480",
    "userCode": "10096999",
    "userName": "ivangreve@gmail.com",
    "realName": "Ivan",
    "token": "Bearer_eyJhbGciOiJIUzI1NiJ9...",
    "orgCode": "100000100000100001100000100002100000100022",
    "orgId": "11495823627446752",
    "orgName": "casa solar",
    "countryId": "11",
    "lang": "es_ES",
    "roleLableEnum": "USER",
    "permissionMenuListVOList": [ ... ],   // menús/permisos del usuario
    "openApiPassword": "..."               // (existe una OpenAPI aparte)
  }
}
```

El **token** sale en `data.token`. Es un **JWT firmado con HS256**, prefijado con
`Bearer_`. El payload trae `iss: "FLS-SOLAR-SERVER"`, `sub` (email), `exp`, `iat`.
**Validez observada: ~30 días** (`exp - iat = 2592000s`).

### 2.3 Cómo se usa el token (OJO con el formato)

En los requests autenticados, el token va en el header `Authorization` **tal cual
viene** — o sea **con `Bearer_` y guión bajo**, NO el `Bearer ` con espacio del
estándar OAuth:

```
Authorization: Bearer_eyJhbGciOiJIUzI1NiJ9...
source: WEB
lang: es_ES
Content-Type: application/json
```

> El frontend guarda el token en `sessionStorage` (clave `authorization`) y un
> interceptor de axios lo inyecta en cada request, además de forzar
> `source: WEB` y el header `lang`.

### 2.4 Registro

El registro vive en el mismo dominio y **usa la misma clave pública RSA** para
encriptar la contraseña antes de mandarla. (Endpoint de alta de usuario en el
flujo de `register`; mismo patrón de encriptación que el login.)

---

## 3. CORS / consumir desde tu app

- La API responde `Access-Control-Allow-Origin: https://shine.felicitysolar.com`
  y `Access-Control-Allow-Credentials: true`.
- Cada POST real va precedido de un **preflight `OPTIONS`** (porque mandás headers
  custom como `Authorization`, `source`, `lang`).
- **Desde un backend / app nativa / Node / móvil → CORS no aplica.** Pegale directo.
- **Desde un browser en OTRO origen → te va a bloquear el CORS.** Si tu app es web,
  necesitás un proxy/backend propio que haga las llamadas server-side.

---

## 4. Catálogo de endpoints capturados

> Base: `https://shine-api.felicitysolar.com`. Todos POST con `Content-Type: application/json`
> salvo los marcados GET. Todos (menos `/userlogin`) requieren el header `Authorization`.
> Paginación estándar: `{ "pageNum": 1, "pageSize": N }`.

### Auth
| Método | Path | Body de ejemplo |
|--------|------|-----------------|
| POST | `/userlogin` | `{ userName, password(RSA), version:"1.0" }` |
| POST | `/switchUsers` | `{ switchUserId: <RSA> }` (cambio de usuario) |

### Dashboard / Home
| Método | Path | Body |
|--------|------|------|
| POST | `/pageData/home_data` | `{ "dataTime": "2026-06-10 09:41:12" }` |
| POST | `/pageData/window_message` | `{}` |
| POST | `/userHomeCard/list_userHomeCard` | `{ "scope": 1 }` |
| POST | `/messageLog/list_pop_up` | `{ userId, pageNum, pageSize }` |
| POST | `/app/bottomNavigationBar/mine/notify_count` | `{ "orgCode": "..." }` |
| GET  | `/app/points/check/submit` | — |
| POST | `/cs/service/url` | `{}` |
| GET  | `/finance/referrer/my` | — |

### Plantas (estaciones)
| Método | Path | Body |
|--------|------|------|
| POST | `/plant/list_plant` | `{ pageNum, pageSize, plantName:"", deviceSn:"", status:"", isCollected:"", plantType:"", onGridType:"", tagName:"", realName:"", orgCode:"", authorized:"", cityId:"", countryId:"", provinceId:"" }` |
| POST | `/plant/list_condition_plant` | `{ pageNum, pageSize, organCode }` |

### Dispositivos
| Método | Path | Body |
|--------|------|------|
| POST | `/device/list_condition_device` | `{ pageNum, pageSize, organCode, plantId:"" }` |
| POST | `/device/list_device_all_type` | `{ pageNum, pageSize, deviceSn:"", status:"", sampleFlag:"", oscFlag:"" }` |
| POST | `/device/device_warring_list` | `{ pageNum, pageSize, plantName:"", deviceSn:"", status:"0", warringType:"", userName:"", orgCode:"", faultcode:"", deviceModel:"", deviceAlias:"", leftDate:<ms>, rightDate:<ms> }` |

### Organización / usuarios / tags
| Método | Path | Body |
|--------|------|------|
| POST | `/organ/list_organ_quick_search` | `{ pageNum, pageSize }` |
| POST | `/adminuser/list_user_name` | `{ pageNum, pageSize }` |
| POST | `/tag/list_tag_name` | `{ pageNum, pageSize: 1000 }` |

### Ubicaciones (catálogos)
| Método | Path | Body / Query |
|--------|------|--------------|
| GET  | `/location/list_country` | — |
| GET  | `/location/list_timeZone` | — |
| POST | `/location/list_tree_country` | `?countryId=11` + `{ "countryId": "11" }` |
| POST | `/location/get` | `{ "names": ["Argentina","Buenos Aires F.D.","Buenos Aires"] }` |
| GET  | `/openApi/get/id/address` | — |

---

## 4-bis. Endpoints de DETALLE (planta / inversor / gráficos)

> Capturados entrando a la planta **"Casa Ivan Challhuaco"** (`plantId = 11495073087033825`)
> y su inversor **IVEM6048** (`deviceSn = 020306004825320543`, `deviceType = "OG"`).
> **Todos verificados desde Node con el token** → `code: 200`. HAR crudo en
> `felicity-capture-detail.har`.

### Detalle de planta
| Método | Path | Body |
|--------|------|------|
| POST | `/plant/plantDetails` | `{ plantId, currentDateStr:"2026-06-10 09:51:58" }` |
| POST | `/plant/getPlantClimateVo` | `{ plantId }` |
| POST | `/homeCard/list_homeCard_device_model` | `{ plantId, useType:1 }` |
| GET  | `/device/get_energy_flow2` | `?deviceSn=&plantId=<id>` |

**`/plant/plantDetails`** → el resumen energético + metadata de la planta. Campos clave:
`todayPv, monthPv, yearPv, accPv` (generación), `pvTodayIncome/monthPvIncome/...`
(ingresos), `todayBatteryCharging/Discharge, todayGridInput, todayFeedOutput, todayLoad`
(flujos de energía), `totalCo2Less` (CO2 ahorrado), `deviceCount/invCount/bpCount`,
`status, plantType, onGridType, countryName, address, longitude, latitude, timeZone`,
y `plantDeviceList` (lista de dispositivos de la planta).

**`/device/get_energy_flow2`** → el **diagrama de flujo de energía** en tiempo real
(PV → batería → carga → red): `pvTotalPower, batteryCharging/Discharge, acTtlInPower,
meterPower, acTotalOutActPower, battSoc, emsPower, genPower, workModeStr, energyFlow`.

### Detalle / tiempo real del inversor
| Método | Path | Body |
|--------|------|------|
| POST | `/device/get_device_snapshot` | `{ deviceSn, deviceType:"OG", dateStr }` |
| POST | `/storageRealtimeData/display` | `{ dateStr, deviceSn, deviceType:"OG" }` |
| POST | `/storageRealtimeData/list_storageRealtimeData_new` | `{ dateStr, deviceSn, deviceType:"OG", pageNum, pageSize }` |

**`/device/get_device_snapshot`** → ⭐ **EL ENDPOINT MÁS VALIOSO PARA MONITOREO.**
Devuelve la foto completa de telemetría del inversor (cientos de campos). Los más útiles:
- **Salida AC:** `acROutVolt` (V), `acROutCurr` (A), `acROutFreq` (Hz), `acTotalOutActPower` (W)
- **FV:** `pvVolt, pv2Volt, pvPower, pv2Power, pvTotalPower, pvTotalVoltage, pvTotalCurr`
- **Batería:** `battSoc` (%), `battSoh`, `battVolt`, `battCurr`, `battCapacity`, `bmsChargingState`
- **Energía:** `eToday, eMonth, eYear, eTotal` (y desgloses `ePvToday, eBatCharToday,
  eGridFeedToday, eLoadToday, eInvToday...`)
- **Temperaturas:** `tempMax, tempMin, mosTemp, pvTemp, battPositiveTemp`
- **Estado/meta:** `status, deviceModel, ratedPower, firmwareVersion, wifiSignal, dataTimeStr`
- Trae datos vivos aunque la planta figure offline (ej: `acROutVolt:"230.1", acROutFreq:"50.01"`).

**`/storageRealtimeData/list_storageRealtimeData_new`** → histórico paginado
(`{ dataList, total, totalPage, pageSize, currentPage }`). Para series temporales.

**`/storageRealtimeData/display`** → tabla de datos en vivo con headers para UI
(`deviceRealTimeDisplayList, deviceRealTimeDisplayHeader, displayClassifyList`).

### Gráficos / series temporales
| Método | Path | Body |
|--------|------|------|
| POST | `/storageRealtimeData/chart_storageRealtimeData_mate` | `{ plantId, chartScope:1, chartDrawingType:2, chartType:1, chartScopeType:1, timeDimension:"hour", dateStr, field:[] }` |
| POST | `/chartTemplate/get_template_list_info` | `{ date:<ms>, dateStr, deviceSn, deviceType:"OG", chartType:0, scopeType:0, chartScopeType:0 }` |
| POST | `/chartTemplateSelect/saveUserRecordTemplateSelect` | `{ id, deviceSn }` |
| POST | `/languageList` | `{}` |

- **`chart_storageRealtimeData_mate`**: la data de los gráficos. `timeDimension` acepta
  `"hour" | "day" | "month" | "year"` para cambiar la granularidad (día/mes/año/histórico).
- **`chartTemplate/*`**: plantillas de gráficos configurables por el usuario.

### ⚠️ Control remoto (escritura al inversor) — NO ejecutado
La grilla de dispositivos tiene un botón **"Control remoto"** que abre el flujo para
**escribir parámetros al inversor** (modo de trabajo, límites de potencia, carga de batería,
on/off, etc). **No lo disparé a propósito**: son comandos de escritura que modifican el
hardware físico real, y tu inversor estaba offline. Cuando lo necesites para tu app,
capturalo con cuidado y en un equipo de prueba — busca endpoints tipo `/device/...control...`
o `...setting...write...`. El frontend usa estos chunks: `editRemote.*.js`, `longControlNew.*.js`.

> **Cobertura actual:** Home, listados (plantas/dispositivos/alarmas), catálogos,
> detalle de planta, detalle/tiempo real de inversor y gráficos. Falta: alarmas en
> detalle, órdenes de trabajo (workOrder), y los comandos de **control remoto** (escritura).

---

## 5. Cliente Node listo para usar

```js
// felicity-client.js — Node 18+ (fetch nativo) o con node-fetch
const crypto = require("crypto");

const API = "https://shine-api.felicitysolar.com";
const PUBKEY_PEM =
  "-----BEGIN PUBLIC KEY-----\n" +
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnAJE68pjWZmtSg6ZJs9FZugJXC6bBSluTW6mJttOLOaljrdErVnM5DNN+YFzpB9pAysTErjY1bnSVuEwQSwptnqUji7Ch2qMj2n+0eCp8p6vtSh7/tFr2ul8nDRtkoswLANAIwtUk/G85ipMpmY1W642LImnEJmGkkddlbjbjxJTZWR5hc/d9cPWb+AR77LxFFrMik3c+44v1kQlIPFP6EjIbOvt/Lv7fHWD9JI/YzN4y1gK7C/VQdNGuikQyNg+5W3rg9ecYf9I5uLAQwY/hxeI3lbNsErebqKe2EbJ8AwcNIC0lDBz53Sq0ML89QapEuy3fB+upuctxLULVDCbNwIDAQAB"
    .match(/.{1,64}/g)
    .join("\n") +
  "\n-----END PUBLIC KEY-----\n";

function encryptPassword(plain) {
  return crypto
    .publicEncrypt(
      { key: PUBKEY_PEM, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(plain, "utf8")
    )
    .toString("base64");
}

class FelicityClient {
  constructor() {
    this.token = null;
    this.user = null;
  }

  async _post(path, body, auth = true) {
    const headers = { "Content-Type": "application/json", source: "WEB", lang: "es_ES" };
    if (auth && this.token) headers.Authorization = this.token; // ya trae "Bearer_"
    const res = await fetch(API + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body || {}),
    });
    const json = await res.json();
    if (json.code !== 200) throw new Error(`${path} → code ${json.code}: ${json.message}`);
    return json.data;
  }

  async login(userName, password) {
    const data = await this._post(
      "/userlogin",
      { userName, password: encryptPassword(password), version: "1.0" },
      false
    );
    this.token = data.token; // "Bearer_eyJ..."
    this.user = data;
    return data;
  }

  listPlants(opts = {}) {
    return this._post("/plant/list_plant", {
      pageNum: 1, pageSize: 10, plantName: "", deviceSn: "", status: "",
      isCollected: "", plantType: "", onGridType: "", tagName: "", realName: "",
      orgCode: this.user.orgCode, authorized: "", cityId: "", countryId: "", provinceId: "",
      ...opts,
    });
  }

  listDevices(plantId = "") {
    return this._post("/device/list_condition_device", {
      pageNum: 1, pageSize: 30, organCode: this.user.orgCode, plantId,
    });
  }

  homeData() {
    return this._post("/pageData/home_data", { dataTime: this._now() });
  }

  // ---- Detalle ----
  _now() { return new Date().toISOString().slice(0, 19).replace("T", " "); }

  plantDetails(plantId) {
    return this._post("/plant/plantDetails", { plantId, currentDateStr: this._now() });
  }

  // ⭐ Telemetría en tiempo real del inversor (battSoc, pvTotalPower, acROutVolt, eToday, ...)
  deviceSnapshot(deviceSn, deviceType = "OG") {
    return this._post("/device/get_device_snapshot", { deviceSn, deviceType, dateStr: this._now() });
  }

  // Diagrama de flujo de energía (PV → batería → carga → red)
  async energyFlow(plantId) {
    const res = await fetch(`${API}/device/get_energy_flow2?deviceSn=&plantId=${plantId}`, {
      headers: { Authorization: this.token, source: "WEB", lang: "es_ES" },
    });
    return (await res.json()).data;
  }

  // Datos de gráfico. timeDimension: "hour" | "day" | "month" | "year"
  chartData(plantId, timeDimension = "hour") {
    return this._post("/storageRealtimeData/chart_storageRealtimeData_mate", {
      plantId, chartScope: 1, chartDrawingType: 2, chartType: 1, chartScopeType: 1,
      timeDimension, dateStr: this._now(), field: [],
    });
  }

  // Histórico paginado de datos del dispositivo
  history(deviceSn, deviceType = "OG", pageNum = 1, pageSize = 10) {
    return this._post("/storageRealtimeData/list_storageRealtimeData_new", {
      dateStr: this._now(), deviceSn, deviceType, pageNum, pageSize,
    });
  }
}

// Uso:
(async () => {
  const c = new FelicityClient();
  await c.login("ivangreve@gmail.com", "TU_PASSWORD");

  const plants = await c.listPlants();
  const plant = plants.list[0];
  console.log("Planta:", plant.plantName, "| id:", plant.id);

  const detail = await c.plantDetails(plant.id);
  console.log("Hoy:", detail.todayPv, detail.todayPvUnit, "| SOC info en snapshot ↓");

  const devices = await c.listDevices(plant.id);
  const sn = devices.list[0].deviceSn;
  const snap = await c.deviceSnapshot(sn);
  console.log("Inversor", sn, "→ SOC:", snap.battSoc, "% | PV:", snap.pvTotalPower, "W | salida:", snap.acTotalOutActPower, "W");
})();
```

---

## 6. Gotchas (resumen para no comerte horas)

1. **Password = RSA-2048 PKCS#1 v1.5** con la clave pública de arriba. Sin esto, el
   login falla. No es texto plano.
2. **`Authorization: Bearer_<jwt>`** → guión bajo, no espacio. Usá el `token` tal
   cual viene en la respuesta del login (ya incluye el prefijo).
3. Headers obligatorios extra: **`source: WEB`** y **`lang: es_ES`**.
4. Todo es **POST con JSON** (salvo algunos GET de catálogo). Hasta los listados.
5. Envelope **`{ code, message, data }`** → chequeá `code === 200`, no el HTTP status
   (algunos errores de negocio vienen con HTTP 200 pero `code` distinto).
6. Token dura **~30 días**; cuando expira, volvé a loguear (no se vio refresh token).
7. **CORS**: desde browser de otro origen te bloquea. Desde backend/Node/móvil, libre.
8. Existe una **OpenAPI oficial** (el login devuelve `openApiPassword`) — puede ser
   un camino más estable y soportado que esta API interna del frontend. Vale la pena
   investigarla antes de casarte con estos endpoints internos.

---

*Capturado con `agent-browser` (CLI de automatización de browser vía CDP). HAR completo
en `felicity-capture.har`.*
