// Pruebas unitarias de los validadores zod (tarea 4.5). Sin BD ni red.
import { describe, it, expect } from "vitest";
import { lecturaSchema } from "../../src/validators/readings.validator.js";
import { crearVerificacionSchema } from "../../src/validators/checks.validator.js";
import { actualizarConfigSchema } from "../../src/validators/config.validator.js";
import {
  slugParamSchema,
  historialQuerySchema,
  crudasQuerySchema,
  rangoFechasQuerySchema,
} from "../../src/validators/spaces.validator.js";

const radarA = { id: "A", present: true, target: "moving", distance_cm: 210, energy: 62 };
const lecturaBase = {
  device_ts: 1791600000000,
  temperature: 24.6,
  humidity: 58.2,
  noise_level: 41,
  radars: [radarA],
};

describe("lecturaSchema (POST /readings)", () => {
  it("acepta una lectura válida del contrato", () => {
    expect(lecturaSchema.safeParse(lecturaBase).success).toBe(true);
  });

  it("acepta una lectura sin device_ts", () => {
    const { device_ts, ...sinTs } = lecturaBase;
    expect(lecturaSchema.safeParse(sinTs).success).toBe(true);
  });

  it("acepta temperature y humidity en null (falló el DHT22)", () => {
    expect(lecturaSchema.safeParse({ ...lecturaBase, temperature: null, humidity: null }).success).toBe(true);
  });

  it("acepta un solo radar por POST (una placa por radar)", () => {
    const radarB = { ...radarA, id: "B" };
    expect(lecturaSchema.safeParse({ ...lecturaBase, radars: [radarB] }).success).toBe(true);
  });

  it("rechaza temperature fuera de rango", () => {
    expect(lecturaSchema.safeParse({ ...lecturaBase, temperature: 120 }).success).toBe(false);
  });

  it("rechaza humidity mayor que 100", () => {
    expect(lecturaSchema.safeParse({ ...lecturaBase, humidity: 101 }).success).toBe(false);
  });

  it("rechaza noise_level ausente", () => {
    const { noise_level, ...sinRuido } = lecturaBase;
    expect(lecturaSchema.safeParse(sinRuido).success).toBe(false);
  });

  it("rechaza un target desconocido", () => {
    const r = lecturaSchema.safeParse({ ...lecturaBase, radars: [{ ...radarA, target: "xyz" }] });
    expect(r.success).toBe(false);
  });

  it("rechaza distance_cm mayor que 1200", () => {
    const r = lecturaSchema.safeParse({ ...lecturaBase, radars: [{ ...radarA, distance_cm: 1201 }] });
    expect(r.success).toBe(false);
  });

  it("rechaza radars vacío y más de 3 radares", () => {
    expect(lecturaSchema.safeParse({ ...lecturaBase, radars: [] }).success).toBe(false);
    expect(lecturaSchema.safeParse({ ...lecturaBase, radars: [radarA, radarA, radarA, radarA] }).success).toBe(false);
  });
});

describe("crearVerificacionSchema (POST /manual-checks)", () => {
  const base = { space: "gastronomia", day: 1, slot: "07:00", manual_state: "parcial" };

  it("acepta una verificación válida", () => {
    expect(crearVerificacionSchema.safeParse(base).success).toBe(true);
  });

  it("acepta con_personas en el Sótano", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, space: "sotano", manual_state: "con_personas" }).success).toBe(true);
  });

  it("rechaza con_personas en gastronomia", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, manual_state: "con_personas" }).success).toBe(false);
  });

  it("rechaza parcial en sotano", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, space: "sotano" }).success).toBe(false);
  });

  it("rechaza day distinto de 1 o 2", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, day: 3 }).success).toBe(false);
  });

  it("rechaza manual_tables_occupied mayor que 7", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, manual_tables_occupied: 8 }).success).toBe(false);
  });

  it("rechaza slot vacío", () => {
    expect(crearVerificacionSchema.safeParse({ ...base, slot: "  " }).success).toBe(false);
  });
});

describe("actualizarConfigSchema (PUT /spaces/:slug/config)", () => {
  const banda = { zone: "A", table_no: 1, min_cm: 0, max_cm: 140 };

  it("acepta una banda válida", () => {
    expect(actualizarConfigSchema.safeParse({ zone_tables: [banda] }).success).toBe(true);
  });

  it("acepta umbrales y ventana", () => {
    expect(actualizarConfigSchema.safeParse({ config: { umbral_personas: 20, ventana_s: 45 } }).success).toBe(true);
  });

  it("rechaza max_cm igual o menor que min_cm", () => {
    expect(actualizarConfigSchema.safeParse({ zone_tables: [{ ...banda, min_cm: 100, max_cm: 100 }] }).success).toBe(false);
  });

  it("rechaza claves desconocidas en config", () => {
    expect(actualizarConfigSchema.safeParse({ config: { foo: 1 } }).success).toBe(false);
  });

  it("rechaza un cuerpo vacío o con config vacío", () => {
    expect(actualizarConfigSchema.safeParse({}).success).toBe(false);
    expect(actualizarConfigSchema.safeParse({ config: {} }).success).toBe(false);
  });

  it("rechaza claves de primer nivel desconocidas", () => {
    expect(actualizarConfigSchema.safeParse({ zone_tables: [banda], otra: 1 }).success).toBe(false);
  });
});

describe("validadores de espacios y métricas", () => {
  it("slug: acepta minúsculas y números, rechaza mayúsculas", () => {
    expect(slugParamSchema.safeParse({ slug: "gastronomia" }).success).toBe(true);
    expect(slugParamSchema.safeParse({ slug: "Sotano" }).success).toBe(false);
  });

  it("hours: por defecto 6, convierte texto a número y respeta 1 a 48", () => {
    expect(historialQuerySchema.parse({}).hours).toBe(6);
    expect(historialQuerySchema.parse({ hours: "12" }).hours).toBe(12);
    expect(historialQuerySchema.safeParse({ hours: "99" }).success).toBe(false);
    expect(historialQuerySchema.safeParse({ hours: "0" }).success).toBe(false);
  });

  it("limit: por defecto 60 y máximo 500", () => {
    expect(crudasQuerySchema.parse({}).limit).toBe(60);
    expect(crudasQuerySchema.safeParse({ limit: "501" }).success).toBe(false);
  });

  it("rango de fechas: opcional, convierte a Date y exige to posterior a from", () => {
    expect(rangoFechasQuerySchema.safeParse({}).success).toBe(true);
    const ok = rangoFechasQuerySchema.parse({ from: "2026-11-04T07:00:00Z", to: "2026-11-04T19:00:00Z" });
    expect(ok.from).toBeInstanceOf(Date);
    expect(
      rangoFechasQuerySchema.safeParse({ from: "2026-11-04T19:00:00Z", to: "2026-11-04T07:00:00Z" }).success
    ).toBe(false);
    expect(rangoFechasQuerySchema.safeParse({ from: "ayer" }).success).toBe(false);
  });
});