// Validates an incoming Bearer access token, then checks blacklist.
// If ok, attaches req.user = { id, tokenJti, tokenVersion }.
const { verifyAccessToken } = require('../utils/jwt');
const { BlacklistedToken } = require('../models');

const auth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: 'Missing access token' });

    // Verify signature + expiry
    const payload = verifyAccessToken(token);

    // Check if this token's JTI was blacklisted (e.g., logout/admin revoke)
    const revoked = await BlacklistedToken.findOne({
      where: { jti: payload.jti },
    });

    if (revoked) return res.status(401).json({ error: 'Token revoked' });

    // Attach identity to the request for downstream handlers
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
