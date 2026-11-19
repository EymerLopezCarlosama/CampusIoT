// Pruebas de integración de la API (tarea 4.5): rutas + PostgreSQL local, con supertest.
// Se corren con `npm run test:integration`. Necesitan `docker compose up -d db` y el seed cargado.
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { env } from "../../src/config/env.js";
import { pool, query } from "../../src/config/database.js";
import { app } from "../../src/app.js";

// Seguro: estas pruebas borran lecturas y verificaciones. Nunca contra Supabase.
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(env.DATABASE_URL)) {
  throw new Error("Las pruebas de integración solo corren contra una base local (DATABASE_URL con localhost).");
}

const KEY_GASTRO = "dev-key-gastronomia";
const KEY_SOTANO = "dev-key-sotano";
const ADMIN = { "x-admin-key": env.ADMIN_KEY };

const radar = (id, distance_cm, energy = 60, present = true) => ({
  id,
  present,
  target: present ? "moving" : "none",
  distance_cm: present ? distance_cm : 0,
  energy: present ? energy : 0,
});
const lectura = (radars, extra = {}) => ({
  temperature: 24.6,
  humidity: 58.2,
  noise_level: 41,
  radars,
  ...extra,
});
const postLectura = (clave, cuerpo) =>
  request(app).post("/api/readings").set("x-api-key", clave).send(cuerpo);

beforeEach(async () => {
  await query("DELETE FROM lectura");
  await query("DELETE FROM verificacion_manual");
});

afterAll(async () => {
  // Deja la calibración como en el seed y la base limpia.
  await query(
    `UPDATE banda_mesa b SET min_cm = 0, max_cm = 150
       FROM zona z WHERE b.id_zona = z.id_zona AND z.codigo = 'A' AND b.num_mesa = 1`
  );
  await query("DELETE FROM lectura");
  await query("DELETE FROM verificacion_manual");
  await pool.end();
});

describe("GET /api/salud", () => {
  it("responde ok y lista los dos nodos", async () => {
    const res = await request(app).get("/api/salud");
    expect(res.status).toBe(200);
    expect(res.body.backend).toBe("ok");
    expect(res.body.base_datos).toBe("ok");
    expect(res.body.nodos.map((n) => n.node)).toEqual(["nodo-gastronomia", "nodo-sotano"]);
  });

  it("una ruta inexistente da 404 con el JSON estándar", async () => {
    const res = await request(app).get("/api/loquesea");
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe("NO_ENCONTRADO");
  });
});

describe("POST /api/readings", () => {
  it("sin clave da 401", async () => {
    const res = await request(app).post("/api/readings").send(lectura([radar("A", 210)]));
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe("API_KEY_INVALIDA");
  });

  it("con una clave desconocida da 401", async () => {
    const res = await postLectura("clave-mala", lectura([radar("A", 210)]));
    expect(res.status).toBe(401);
  });

  it("con JSON mal formado da 400", async () => {
    const res = await request(app)
      .post("/api/readings")
      .set("x-api-key", KEY_GASTRO)
      .set("Content-Type", "application/json")
      .send("{mal");
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("DATOS_INVALIDOS");
  });

  it("con temperatura fuera de rango da 400", async () => {
    const res = await postLectura(KEY_GASTRO, lectura([radar("A", 210)], { temperature: 120 }));
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("DATOS_INVALIDOS");
  });

  it("con un radar que no es del nodo da 400 RADAR_DESCONOCIDO", async () => {
    const res = await postLectura(KEY_SOTANO, lectura([radar("A", 210)]));
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("RADAR_DESCONOCIDO");
  });

  it("radar A en la mesa 2 de Gastronomía da 201, 1 mesa y parcial", async () => {
    const res = await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ state: "parcial", tables_occupied: 1 });
    expect(typeof res.body.id).toBe("number");
  });

  it("dos placas con la misma clave: el radar B en otro POST suma una mesa", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    const res = await postLectura(KEY_GASTRO, lectura([radar("B", 100)]));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ state: "parcial", tables_occupied: 2 });
  });

  it("Sótano con energía 70 da lleno y tables_occupied null", async () => {
    const res = await postLectura(KEY_SOTANO, lectura([radar("S", 300, 70)]));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ state: "lleno", tables_occupied: null });
  });

  it("Sótano con energía 35 da con_personas", async () => {
    const res = await postLectura(KEY_SOTANO, lectura([radar("S", 300, 35)]));
    expect(res.body.state).toBe("con_personas");
  });

  it("una distancia fuera de toda banda no cuenta (pasillo)", async () => {
    const res = await postLectura(KEY_GASTRO, lectura([radar("A", 600)]));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ state: "libre", tables_occupied: 0 });
  });

  it("la lectura queda guardada con radars como arreglo", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    const { rows } = await query("SELECT radares, estado FROM lectura");
    expect(rows).toHaveLength(1);
    expect(Array.isArray(rows[0].radares)).toBe(true);
    expect(rows[0].estado).toBe("parcial");
  });
});

describe("GET /api/spaces", () => {
  it("sin lecturas, los dos espacios están sin_conexion", async () => {
    const res = await request(app).get("/api/spaces");
    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.state)).toEqual(["sin_conexion", "sin_conexion"]);
    expect(res.body[0].temperature).toBeNull();
  });

  it("con lecturas frescas muestra estado, mesas y valores ambientales", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    await postLectura(KEY_GASTRO, lectura([radar("B", 100)]));
    await postLectura(KEY_SOTANO, lectura([radar("S", 300, 70)]));
    const res = await request(app).get("/api/spaces");
    const gastro = res.body.find((e) => e.slug === "gastronomia");
    const sotano = res.body.find((e) => e.slug === "sotano");
    expect(gastro).toMatchObject({ state: "parcial", tables_occupied: 2, total_tables: 4, temperature: 24.6 });
    expect(sotano).toMatchObject({ state: "lleno", tables_occupied: null, total_tables: 7 });
  });

  it("si una placa de Gastronomía se calla, el espacio pasa a sin_conexion aunque la otra siga", async () => {
    const { rows } = await query("SELECT id_nodo FROM nodo WHERE nombre = 'nodo-gastronomia'");
    const insertar = (id, segundos) =>
      query(
        `INSERT INTO lectura (id_nodo, fecha_recepcion, nivel_ruido, radares, mesas_ocupadas, estado)
         VALUES ($1, now() - make_interval(secs => $2), 40, $3::jsonb, 2, 'parcial')`,
        [rows[0].id_nodo, segundos, JSON.stringify([radar(id, 210)])]
      );
    await insertar("B", 120); // la placa B lleva 2 minutos callada
    await insertar("A", 1); // la placa A sigue enviando
    const res = await request(app).get("/api/spaces");
    const gastro = res.body.find((e) => e.slug === "gastronomia");
    expect(gastro.state).toBe("sin_conexion");
    expect(gastro.temperature).toBeNull();
  });

  it("el historial devuelve promedios por minuto y rechaza hours fuera de rango", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    const ok = await request(app).get("/api/spaces/gastronomia/history?hours=1");
    expect(ok.status).toBe(200);
    expect(ok.body.length).toBeGreaterThanOrEqual(1);
    expect(ok.body[0]).toHaveProperty("t");
    const mal = await request(app).get("/api/spaces/gastronomia/history?hours=99");
    expect(mal.status).toBe(400);
  });

  it("un espacio inexistente da 404", async () => {
    const res = await request(app).get("/api/spaces/nada/history");
    expect(res.status).toBe(404);
  });

  it("/raw exige x-admin-key y devuelve lecturas con radars", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    const sin = await request(app).get("/api/spaces/gastronomia/raw?limit=2");
    expect(sin.status).toBe(401);
    const con = await request(app).get("/api/spaces/gastronomia/raw?limit=2").set(ADMIN);
    expect(con.status).toBe(200);
    expect(con.body[0].radars[0].id).toBe("A");
    expect(con.body[0]).toHaveProperty("received_at");
  });
});

describe("Calibración /api/spaces/:slug/config", () => {
  it("GET es público y trae las bandas y la ventana", async () => {
    const res = await request(app).get("/api/spaces/gastronomia/config");
    expect(res.status).toBe(200);
    expect(res.body.config.ventana_s).toBe(45);
    expect(res.body.zones.find((z) => z.code === "A").tables).toHaveLength(3);
  });

  it("PUT sin clave da 401", async () => {
    const res = await request(app)
      .put("/api/spaces/gastronomia/config")
      .send({ zone_tables: [{ zone: "A", table_no: 1, min_cm: 0, max_cm: 140 }] });
    expect(res.status).toBe(401);
  });

  it("bandas solapadas dan 400 BANDAS_SOLAPADAS", async () => {
    const res = await request(app)
      .put("/api/spaces/gastronomia/config")
      .set(ADMIN)
      .send({ zone_tables: [{ zone: "A", table_no: 1, min_cm: 0, max_cm: 160 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe("BANDAS_SOLAPADAS");
  });

  it("zona inexistente da 404 y clave desconocida da 400", async () => {
    const zona = await request(app)
      .put("/api/spaces/gastronomia/config")
      .set(ADMIN)
      .send({ zone_tables: [{ zone: "Z", table_no: 1, min_cm: 0, max_cm: 100 }] });
    expect(zona.status).toBe(404);
    const clave = await request(app).put("/api/spaces/sotano/config").set(ADMIN).send({ config: { foo: 1 } });
    expect(clave.status).toBe(400);
  });

  it("un cambio de banda se aplica a la lectura siguiente, sin reiniciar", async () => {
    const cambiar = (max_cm) =>
      request(app)
        .put("/api/spaces/gastronomia/config")
        .set(ADMIN)
        .send({ zone_tables: [{ zone: "A", table_no: 1, min_cm: 0, max_cm }] });

    expect((await cambiar(140)).status).toBe(200);
    const antes = await postLectura(KEY_GASTRO, lectura([radar("A", 145)])); // cae en el hueco 140-150
    expect(antes.body.tables_occupied).toBe(0);

    expect((await cambiar(150)).status).toBe(200);
    const despues = await postLectura(KEY_GASTRO, lectura([radar("A", 145)]));
    expect(despues.body.tables_occupied).toBe(1);
  });
});

describe("Verificación manual y resumen", () => {
  const verificacion = (extra = {}) => ({
    space: "gastronomia",
    day: 1,
    slot: "07:00",
    manual_state: "parcial",
    ...extra,
  });

  it("coincide con el sistema: 201 y match true", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    await postLectura(KEY_GASTRO, lectura([radar("B", 100)]));
    const res = await request(app).post("/api/manual-checks").send(verificacion({ observer: "Maria" }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ system_state: "parcial", match: true });
  });

  it("no coincide: match false", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    await postLectura(KEY_GASTRO, lectura([radar("B", 100)]));
    const res = await request(app).post("/api/manual-checks").send(verificacion({ manual_state: "libre" }));
    expect(res.body.match).toBe(false);
  });

  it("sin lecturas el sistema está sin_conexion y no coincide", async () => {
    const res = await request(app)
      .post("/api/manual-checks")
      .send(verificacion({ space: "sotano", manual_state: "libre" }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ system_state: "sin_conexion", match: false });
  });

  it("la misma franja dos veces da 409 FRANJA_DUPLICADA", async () => {
    await request(app).post("/api/manual-checks").send(verificacion());
    const res = await request(app).post("/api/manual-checks").send(verificacion());
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe("FRANJA_DUPLICADA");
  });

  it("estados inválidos por espacio, día 3 y espacio inexistente", async () => {
    expect((await request(app).post("/api/manual-checks").send(verificacion({ manual_state: "con_personas" }))).status).toBe(400);
    expect((await request(app).post("/api/manual-checks").send(verificacion({ space: "sotano", manual_state: "parcial" }))).status).toBe(400);
    expect((await request(app).post("/api/manual-checks").send(verificacion({ day: 3 }))).status).toBe(400);
    expect((await request(app).post("/api/manual-checks").send(verificacion({ space: "nada" }))).status).toBe(404);
  });

  it("el resumen calcula la coincidencia sobre las 40 previstas", async () => {
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    await postLectura(KEY_GASTRO, lectura([radar("B", 100)]));
    await request(app).post("/api/manual-checks").send(verificacion({ slot: "07:00" })); // coincide
    await request(app).post("/api/manual-checks").send(verificacion({ slot: "08:00", manual_state: "libre" })); // no
    const res = await request(app).get("/api/validation/summary");
    expect(res.body).toEqual({
      total: 40,
      registered: 2,
      matches: 1,
      coincidence_pct: 2.5,
      goal_pct: 80,
      goal_met: false,
    });
  });

  it("el CSV se descarga con encabezado y una fila por verificación", async () => {
    await request(app).post("/api/manual-checks").send(verificacion({ observer: "=SUMA(1;1)" }));
    const res = await request(app).get("/api/validation/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("verificacion.csv");
    const lineas = res.text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    expect(lineas[0]).toBe("space,day,slot,manual_state,system_state,match,observer,created_at");
    expect(lineas).toHaveLength(2);
    expect(lineas[1]).toContain("'=SUMA(1;1)"); // neutraliza fórmulas de Excel
  });
});

describe("GET /api/metrics", () => {
  it("expected cuenta por placa: Gastronomía (2 zonas) espera el doble que el Sótano", async () => {
    const desde = new Date(Date.now() - 60_000).toISOString();
    await postLectura(KEY_GASTRO, lectura([radar("A", 210)]));
    await postLectura(KEY_SOTANO, lectura([radar("S", 300, 70)]));
    const hasta = new Date(Date.now() + 1000).toISOString();
    const res = await request(app).get(`/api/metrics?from=${desde}&to=${hasta}`);
    expect(res.status).toBe(200);
    const gastro = res.body.nodes.find((n) => n.node === "nodo-gastronomia");
    const sotano = res.body.nodes.find((n) => n.node === "nodo-sotano");
    expect(gastro.expected).toBe(sotano.expected * 2);
    expect(gastro.received).toBe(1);
    expect(sotano.received).toBe(1);
    expect(res.body.goal).toEqual({ availability_pct: 90, max_delay_s: 10 });
  });

  it("un rango invertido o una fecha inválida dan 400", async () => {
    const invertido = await request(app).get(
      "/api/metrics?from=2026-11-17T19:00:00Z&to=2026-11-17T07:00:00Z"
    );
    expect(invertido.status).toBe(400);
    const mala = await request(app).get("/api/metrics?from=ayer");
    expect(mala.status).toBe(400);
  });
});