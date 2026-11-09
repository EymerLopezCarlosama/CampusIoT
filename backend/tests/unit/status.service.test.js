// Pruebas de services/status.service.js (funciones puras, sin BD). Tarea 4.5 · paso B5.
import { describe, it, expect } from "vitest";
import {
  mesasOcupadas,
  estadoGastronomia,
  estadoSotano,
  calcularEstado,
  estadoConConexion,
} from "../../src/services/status.service.js";

// Bandas del seed (cm). Zona A: 3 mesas; zona B: 1 mesa.
const zonas = [
  {
    code: "A",
    tables: [
      { table_no: 1, min_cm: 0, max_cm: 150 },
      { table_no: 2, min_cm: 150, max_cm: 300 },
      { table_no: 3, min_cm: 300, max_cm: 450 },
    ],
  },
  { code: "B", tables: [{ table_no: 1, min_cm: 0, max_cm: 400 }] },
];
const gastronomia = { mode: "mesas", total_tables: 4 };
const sotano = { mode: "espacio", total_tables: 7 };

const radarA = (distance_cm, present = true) => ({
  id: "A", present, target: present ? "static" : "none", distance_cm: present ? distance_cm : 0, energy: present ? 50 : 0,
});
const radarB = (present = true) => ({
  id: "B", present, target: present ? "static" : "none", distance_cm: present ? 200 : 0, energy: present ? 50 : 0,
});
const radarS = (energy) => ({
  id: "S", present: energy > 0, target: energy > 0 ? "static" : "none", distance_cm: energy > 0 ? 300 : 0, energy,
});
const lectura = (...radars) => ({ radars });

describe("status.service", () => {
  it("Gastronomía: radar A en banda de la mesa 2 → 1 mesa y 'parcial'", () => {
    const r = calcularEstado(gastronomia, zonas, { ventana_s: 45 }, [lectura(radarA(200), radarB(false))]);
    expect(r).toEqual({ state: "parcial", tables_occupied: 1 });
  });

  it("Gastronomía con ventana: mesa 1 y luego mesa 3 dentro de ventana_s → 2 mesas", () => {
    expect(mesasOcupadas([lectura(radarA(100)), lectura(radarA(380))], zonas)).toBe(2);
    expect(mesasOcupadas([lectura(radarA(100))], zonas)).toBe(1); // una sola lectura nunca ve dos
  });

  it("Bandas [min, max): 150 cuenta para la mesa 2; 449 para la 3; 450 queda fuera", () => {
    expect(mesasOcupadas([lectura(radarA(150))], zonas)).toBe(1);
    // 150 es mesa 2, no mesa 1: sumado a una lectura en mesa 1 da 2 mesas distintas
    expect(mesasOcupadas([lectura(radarA(149)), lectura(radarA(150))], zonas)).toBe(2);
    expect(mesasOcupadas([lectura(radarA(449))], zonas)).toBe(1);
    expect(mesasOcupadas([lectura(radarA(450))], zonas)).toBe(0);
  });

  it("Gastronomía: 3 mesas de A + mesa B → 4 y 'lleno'; ninguna → 0 y 'libre'", () => {
    const ventana = [lectura(radarA(50), radarB()), lectura(radarA(200), radarB()), lectura(radarA(400), radarB())];
    expect(calcularEstado(gastronomia, zonas, {}, ventana)).toEqual({ state: "lleno", tables_occupied: 4 });
    expect(calcularEstado(gastronomia, zonas, {}, [lectura(radarA(0, false), radarB(false))])).toEqual({
      state: "libre",
      tables_occupied: 0,
    });
    expect(estadoGastronomia(3, 4)).toBe("parcial");
  });

  it("Objetivo fuera de toda banda (pasillo) → no cuenta", () => {
    expect(mesasOcupadas([lectura(radarA(600)), lectura(radarA(1000))], zonas)).toBe(0);
  });

  it("Sótano: energía promedio vs umbral_personas y umbral_lleno", () => {
    const config = { umbral_personas: 15, umbral_lleno: 60, ventana_s: 60 };
    const con = (...energias) => energias.map((e) => lectura(radarS(e)));

    expect(estadoSotano(con(5, 10, 0), config)).toBe("libre"); // promedio 5
    expect(estadoSotano(con(15, 15), config)).toBe("con_personas"); // 15 no es < 15
    expect(estadoSotano(con(40, 50), config)).toBe("con_personas"); // 45
    expect(estadoSotano(con(60, 60), config)).toBe("lleno"); // 60 no es < 60
    expect(estadoSotano(con(100, 80), config)).toBe("lleno");
    expect(calcularEstado(sotano, [], config, con(40))).toEqual({ state: "con_personas", tables_occupied: null });
    // El umbral viene por parámetro: cambiarlo cambia el estado sin tocar el servicio
    expect(estadoSotano(con(40), { ...config, umbral_personas: 50 })).toBe("libre");
    expect(() => estadoSotano(con(40), {})).toThrow(/umbral_personas/);
  });

  it("Lectura sin objetivo (present false) → 0 mesas", () => {
    expect(mesasOcupadas([lectura(radarA(0, false), radarB(false))], zonas)).toBe(0);
    // present=false con distancia dentro de banda tampoco cuenta
    expect(mesasOcupadas([lectura({ id: "A", present: false, target: "none", distance_cm: 100, energy: 0 })], zonas)).toBe(0);
  });

  it("estadoConConexion: hace 31 s → 'sin_conexion'; hace 5 s → estado normal", () => {
    const ahora = new Date("2026-11-07T15:00:00Z");
    const hace = (s) => new Date(ahora.getTime() - s * 1000).toISOString();
    expect(estadoConConexion("parcial", hace(31), ahora, 30)).toBe("sin_conexion");
    expect(estadoConConexion("parcial", hace(30), ahora, 30)).toBe("parcial");
    expect(estadoConConexion("parcial", hace(5), ahora, 30)).toBe("parcial");
    expect(estadoConConexion("lleno", null, ahora, 30)).toBe("sin_conexion");
  });
});