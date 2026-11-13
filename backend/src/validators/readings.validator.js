// Validación (zod) del cuerpo de POST /readings (HU-01). Se aplica con middlewares/validate.js.
import { z } from "zod";

const numero = (nombre) =>
  z.number({
    required_error: `${nombre} es obligatorio.`,
    invalid_type_error: `${nombre} debe ser un número.`,
  });

const radarSchema = z.object({
  id: z
    .string({ required_error: "id es obligatorio.", invalid_type_error: "id debe ser texto." })
    .min(1, "id no puede estar vacío.")
    .max(4, "id puede tener máximo 4 caracteres."),
  present: z.boolean({
    required_error: "present es obligatorio.",
    invalid_type_error: "present debe ser true o false.",
  }),
  target: z.enum(["moving", "static", "both", "none"], {
    errorMap: () => ({ message: "target debe ser moving, static, both o none." }),
  }),
  distance_cm: numero("distance_cm")
    .int("distance_cm debe ser un entero.")
    .min(0, "distance_cm debe estar entre 0 y 1200.")
    .max(1200, "distance_cm debe estar entre 0 y 1200."),
  energy: numero("energy")
    .int("energy debe ser un entero.")
    .min(0, "energy debe estar entre 0 y 100.")
    .max(100, "energy debe estar entre 0 y 100."),
});

export const lecturaSchema = z.object({
  // Milisegundos desde 1970 (NTP del nodo). Opcional: sin él no se mide el retardo.
  device_ts: z
    .number({ invalid_type_error: "device_ts debe ser un número." })
    .int("device_ts debe ser un entero.")
    .positive("device_ts debe ser positivo.")
    .optional(),
  // null cuando el DHT22 falló esa vez.
  temperature: numero("temperature")
    .min(-40, "La temperatura debe estar entre -40 y 80 °C.")
    .max(80, "La temperatura debe estar entre -40 y 80 °C.")
    .nullable(),
  humidity: numero("humidity")
    .min(0, "La humedad debe estar entre 0 y 100 %.")
    .max(100, "La humedad debe estar entre 0 y 100 %.")
    .nullable(),
  noise_level: numero("noise_level")
    .min(0, "noise_level debe estar entre 0 y 100.")
    .max(100, "noise_level debe estar entre 0 y 100."),
  radars: z
    .array(radarSchema, {
      required_error: "radars es obligatorio.",
      invalid_type_error: "radars debe ser una lista.",
    })
    .min(1, "radars debe tener entre 1 y 3 radares.")
    .max(3, "radars debe tener entre 1 y 3 radares."),
});