// App de Express sin listen() (así se prueba con supertest). Sirve la API y la página desde el mismo servidor.
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", routes);
app.use(express.static(path.resolve(__dirname, "../../frontend")));
app.use(notFound);
app.use(errorHandler);