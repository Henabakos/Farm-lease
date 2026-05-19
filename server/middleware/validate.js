// Zod-based request validation. Pass a schema object with any combination of
// { body, params, query } and the parsed/typed values are written back to
// the request so downstream handlers always read sanitized inputs.
//
//   router.post('/x', validate({ body: createSchema }), handler);
import { ZodError } from 'zod';
import { ValidationError } from '../shared/errors.js';

export function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body)   req.body   = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query)  req.query  = schemas.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return next(new ValidationError('Validation failed', details));
      }
      next(err);
    }
  };
}
