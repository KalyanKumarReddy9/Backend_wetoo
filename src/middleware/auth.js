const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  let token = header.startsWith('Bearer ') ? header.slice(7) : null;
  // Fallback: accept token via query for image fetches without headers
  if (!token && req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload;
    // expose token back to downstream handlers if they need to build URLs
    req.token = token;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authMiddleware;

