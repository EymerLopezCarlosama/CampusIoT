// Validación (zod) de la calibración (HU-06). Se aplica con middlewares/validate.js.
import { z } from "zod";

const entero = (nombre) =>
  z
    .number({
      required_error: `${nombre} es obligatorio.`,
      invalid_type_error: `${nombre} debe ser un número.`,
    })
    .int(`${nombre} debe ser un entero.`);

const parametro = (nombre, min, max) =>
  z
    .number({ invalid_type_error: `${nombre} debe ser un número.` })
    .min(min, `${nombre} debe estar entre ${min} y ${max}.`)
    .max(max, `${nombre} debe estar entre ${min} y ${max}.`)
    .optional();

// Solo estas claves; cualquier otra es error.
const configSchema = z
  .object({
    umbral_personas: parametro("umbral_personas", 0, 100),
    umbral_lleno: parametro("umbral_lleno", 0, 100),
    ventana_s: parametro("ventana_s", 1, 300),
  })
  .strict("Clave no permitida: solo se aceptan umbral_personas, umbral_lleno y ventana_s.");

const zonaMesaSchema = z
  .object({
    zone: z
      .string({ required_error: "zone es obligatorio.", invalid_type_error: "zone debe ser texto." })
      .min(1, "zone no puede estar vacío.")
      .max(4, "zone puede tener máximo 4 caracteres."),
    table_no: entero("table_no").min(1, "table_no debe ser 1 o mayor."),
    min_cm: entero("min_cm").min(0, "min_cm no puede ser negativo."),
    max_cm: entero("max_cm"),
  })
  .refine((m) => m.max_cm > m.min_cm, {
    message: "max_cm debe ser mayor que min_cm.",
    path: ["max_cm"],
  });

export const actualizarConfigSchema = z
  .object({
    config: configSchema.optional(),
    zone_tables: z.array(zonaMesaSchema).min(1, "zone_tables no puede estar vacío.").optional(),
  })
  .strict("Solo se aceptan config y zone_tables.")
  .refine((b) => (b.config && Object.keys(b.config).length > 0) || b.zone_tables, {
    message: "Debe enviar config o zone_tables.",
  });