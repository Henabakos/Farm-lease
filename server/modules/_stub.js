// Generates a uniform "not yet implemented" router used for modules whose
// rewrite is queued for Phase 5+. Returning 501 with a stable shape keeps
// the frontend from receiving HTML 404 pages while we ship modules
// incrementally.
import express from 'express';

export function makeStubRouter(moduleName) {
  const router = express.Router();
  router.use((req, res) => {
    res.status(501).json({
      error: `Module "${moduleName}" not yet implemented`,
      code: 'NOT_IMPLEMENTED',
      module: moduleName,
      method: req.method,
      path: req.originalUrl,
    });
  });
  return router;
}
