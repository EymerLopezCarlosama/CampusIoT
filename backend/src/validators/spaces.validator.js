// Validación (zod) de espacios y métricas. Se aplica con middlewares/validate.js.
import { z } from "zod";

export const slugParamSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]{1,30}$/, "slug debe tener 1 a 30 letras minúsculas o números."),
});

export const historialQuerySchema = z.object({
  hours: z.coerce
    .number({ invalid_type_error: "hours debe ser un número." })
    .int("hours debe ser un entero.")
    .min(1, "hours debe estar entre 1 y 48.")
    .max(48, "hours debe estar entre 1 y 48.")
    .default(6),
});

export const crudasQuerySchema = z.object({
  limit: z.coerce
    .number({ invalid_type_error: "limit debe ser un número." })
    .int("limit debe ser un entero.")
    .min(1, "limit debe estar entre 1 y 500.")
    .max(500, "limit debe estar entre 1 y 500.")
    .default(60),
});

// from/to opcionales, en ISO 8601. Quedan convertidos a Date; si vienen los dos, to > from.
const fechaIso = z
  .string()
  .datetime({ offset: true, message: "Debe ser una fecha ISO 8601 (ej. 2026-11-04T07:00:00Z)." })
  .transform((texto) => new Date(texto));

export const rangoFechasQuerySchema = z
  .object({
    from: fechaIso.optional(),
    to: fechaIso.optional(),
  })
  .refine((q) => !q.from || !q.to || q.to > q.from, {
    message: "to debe ser posterior a from.",
    path: ["to"],
  });