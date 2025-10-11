// Validates an incoming Bearer access token and attaches req.user.
const { verifyAccessToken } = require('../utils/jwt');

const auth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Missing access token' });

  try {
    const payload = verifyAccessToken(token); // signature + expiry check
    req.user = {
      id: payload.sub,
      tokenJti: payload.jti,
      tokenVersion: payload.tokenVersion,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
