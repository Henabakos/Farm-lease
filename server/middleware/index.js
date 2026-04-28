import jwt from 'jsonwebtoken';

// Auth middleware - verifies JWT token and attaches user to request
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabase = req.app.locals.supabase;
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('[v0] Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based access control middleware
export const rbacMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const supabase = req.app.locals.supabase;
      const userId = req.userId;

      // Fetch user role from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        return res.status(403).json({ error: 'User not found' });
      }

      if (!allowedRoles.includes(userData.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = userData.role;
      next();
    } catch (error) {
      console.error('[v0] RBAC middleware error:', error.message);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Audit logging middleware
export const auditLogger = (supabase) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      // Log the request after response is sent
      setImmediate(() => {
        const userId = req.user?.id || req.userId;
        const method = req.method;
        const path = req.path;
        const statusCode = res.statusCode;
        const action = `${method} ${path}`;

        if (userId && method !== 'GET') {
          supabase
            .from('audit_logs')
            .insert({
              user_id: userId,
              action: action,
              entity_type: path.split('/')[2],
              changes: req.body,
              ip_address: req.ip,
              user_agent: req.get('user-agent')
            })
            .catch(err => console.error('[v0] Audit log failed:', err.message));
        }
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error('[v0] Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Validation middleware helper
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    req.validatedData = value;
    next();
  };
};
