// validate({ body, params, query }): valida con esquemas zod y reemplaza req.* por los datos ya convertidos.
export function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query) req.query = query.parse(req.query);
      next();
    } catch (err) {
      next(err); // ZodError: error-handler lo convierte en 400 DATOS_INVALIDOS
    }
  };
}