// Wrap async route handlers so thrown / rejected errors propagate to the
// central errorHandler. Avoids try/catch noise in every controller.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
