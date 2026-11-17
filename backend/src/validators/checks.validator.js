// Validación (zod) de la verificación manual (HU-07). Se aplica con middlewares/validate.js.
import { z } from "zod";

const ESTADOS = ["libre", "parcial", "con_personas", "lleno"];

export const crearVerificacionSchema = z
  .object({
    space: z
      .string({ required_error: "space es obligatorio.", invalid_type_error: "space debe ser texto." })
      .regex(/^[a-z0-9]{1,30}$/, "space debe ser el slug del espacio (ej. gastronomia)."),
    day: z
      .number({ required_error: "day es obligatorio.", invalid_type_error: "day debe ser un número." })
      .int("day debe ser un entero.")
      .min(1, "day debe ser 1 o 2.")
      .max(2, "day debe ser 1 o 2."),
    slot: z
      .string({ required_error: "slot es obligatorio.", invalid_type_error: "slot debe ser texto." })
      .trim()
      .min(1, "slot no puede estar vacío.")
      .max(10, "slot puede tener máximo 10 caracteres."),
    manual_state: z.enum(ESTADOS, {
      errorMap: () => ({ message: "manual_state debe ser libre, parcial, con_personas o lleno." }),
    }),
    manual_tables_occupied: z
      .number({ invalid_type_error: "manual_tables_occupied debe ser un número." })
      .int("manual_tables_occupied debe ser un entero.")
      .min(0, "manual_tables_occupied debe estar entre 0 y 7.")
      .max(7, "manual_tables_occupied debe estar entre 0 y 7.")
      .optional(),
    observer: z
      .string({ invalid_type_error: "observer debe ser texto." })
      .trim()
      .max(50, "observer puede tener máximo 50 caracteres.")
      .optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.space === "gastronomia" && datos.manual_state === "con_personas") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manual_state"],
        message: "En gastronomia el estado 'con_personas' no es válido; use 'parcial'.",
      });
    }
    if (datos.space === "sotano" && datos.manual_state === "parcial") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manual_state"],
        message: "En sotano el estado 'parcial' no es válido; use 'con_personas'.",
      });
    }
  });