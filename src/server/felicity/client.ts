import { encryptPassword } from "./crypto";
import type { FelicityEnvelope, FelicityLoginData } from "./types";

const API_BASE = process.env.FELICITY_API_BASE ?? "https://shine-api.felicitysolar.com";

class FelicityError extends Error {
  constructor(
    public path: string,
    public code: number,
    message: string,
  ) {
    super(`Felicity ${path} → code ${code}: ${message}`);
    this.name = "FelicityError";
  }
}

/**
 * Cliente server-side de la API interna de Felicity.
 * NUNCA debe instanciarse en el browser: maneja credenciales y token.
 * Cachea el token y re-loguea automáticamente cuando expira (~30 días) o ante 401.
 */
export class FelicityClient {
  private token: string | null = null;
  private tokenExp = 0; // epoch ms

  constructor(
    private userName = process.env.FELICITY_USERNAME ?? "",
    private password = process.env.FELICITY_PASSWORD ?? "",
  ) {}

  private baseHeaders(): Record<string, string> {
    return { "Content-Type": "application/json", source: "WEB", lang: "es_ES" };
  }

  /** Decodifica el `exp` del JWT (token con prefijo "Bearer_"). */
  private parseExp(token: string): number {
    try {
      const jwt = token.replace(/^Bearer_/, "");
      const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
      return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
      return 0;
    }
  }

  async login(): Promise<FelicityLoginData> {
    if (!this.userName || !this.password) {
      throw new Error("Faltan FELICITY_USERNAME / FELICITY_PASSWORD en el entorno");
    }
    const data = await this.request<FelicityLoginData>(
      "/userlogin",
      { userName: this.userName, password: encryptPassword(this.password), version: "1.0" },
      { auth: false },
    );
    this.token = data.token;
    this.tokenExp = this.parseExp(data.token);
    return data;
  }

  /** Devuelve un token válido, logueando si hace falta (margen de 1 día). */
  private async ensureToken(): Promise<string> {
    const margin = 24 * 60 * 60 * 1000;
    if (!this.token || Date.now() > this.tokenExp - margin) {
      await this.login();
    }
    return this.token!;
  }

  /** POST genérico al envelope de Felicity. Reintenta una vez si el token expiró. */
  async request<T>(
    path: string,
    body: Record<string, unknown> = {},
    opts: { auth?: boolean; method?: "POST" | "GET" } = {},
  ): Promise<T> {
    const { auth = true, method = "POST" } = opts;
    const headers = this.baseHeaders();
    if (auth) headers.Authorization = await this.ensureToken();

    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as FelicityEnvelope<T>;

    // 401-like de negocio → re-login y un reintento
    if (auth && (json.code === 401 || json.code === 403)) {
      await this.login();
      headers.Authorization = this.token!;
      const retry = await fetch(API_BASE + path, {
        method,
        headers,
        body: method === "POST" ? JSON.stringify(body) : undefined,
      });
      const retryJson = (await retry.json()) as FelicityEnvelope<T>;
      if (retryJson.code !== 200) throw new FelicityError(path, retryJson.code, retryJson.message);
      return retryJson.data;
    }

    if (json.code !== 200) throw new FelicityError(path, json.code, json.message);
    return json.data;
  }

  // ── Endpoints (ver docs/API_FELICITYSOLAR.md) ──────────────────────────────

  /** Extrae el array de una respuesta paginada (Felicity usa `dataList`, a veces `list`). */
  private listOf(d: Raw): { list: Raw[]; total: number } {
    const list = (d.dataList ?? d.list ?? (Array.isArray(d.data) ? d.data : [])) as Raw[];
    return { list: list ?? [], total: (d.total as number) ?? list?.length ?? 0 };
  }

  async listPlants(opts: Record<string, unknown> = {}) {
    const d = await this.request<Raw>("/plant/list_plant", {
      pageNum: 1, pageSize: 100, plantName: "", deviceSn: "", status: "", isCollected: "",
      plantType: "", onGridType: "", tagName: "", realName: "", orgCode: "", authorized: "",
      cityId: "", countryId: "", provinceId: "", ...opts,
    });
    return this.listOf(d);
  }

  async listDevices(plantId: string, organCode = "") {
    const d = await this.request<Raw>("/device/list_condition_device", {
      pageNum: 1, pageSize: 100, organCode, plantId,
    });
    return this.listOf(d);
  }

  plantDetails(plantId: string) {
    return this.request<Raw>("/plant/plantDetails", { plantId, currentDateStr: nowStr() });
  }

  /** Snapshot de telemetría en vivo del inversor. */
  deviceSnapshot(deviceSn: string, deviceType = "OG") {
    return this.request<Raw>("/device/get_device_snapshot", { deviceSn, deviceType, dateStr: nowStr() });
  }

  /** Histórico crudo paginado (resolución 5 min). Fuente confiable para backfill. */
  history(deviceSn: string, dateStr: string, pageNum = 1, pageSize = 300, deviceType = "OG") {
    return this.request<{ dataList?: Raw[]; data?: Raw[]; total: number; totalPage: number }>(
      "/storageRealtimeData/list_storageRealtimeData_new",
      { dateStr, deviceSn, deviceType, pageNum, pageSize },
    );
  }
}

type Raw = Record<string, unknown>;

/** "YYYY-MM-DD HH:mm:ss" en hora local (formato que espera Felicity). */
export function nowStr(d = new Date()): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}
