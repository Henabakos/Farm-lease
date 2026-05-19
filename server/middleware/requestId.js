// Assign a unique id to every request for log correlation. Honors an upstream
// X-Request-Id if provided (useful behind a load balancer / nginx).
import { nanoid } from 'nanoid';

export function requestId() {
  return (req, res, next) => {
    const incoming = req.headers['x-request-id'];
    req.id = typeof incoming === 'string' && incoming.length <= 64 ? incoming : nanoid(16);
    res.setHeader('X-Request-Id', req.id);
    next();
  };
}
