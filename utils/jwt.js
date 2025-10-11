// JWT helpers for creating/verifying access & refresh tokens.
// Each token includes a minimal payload: sub(userId), type, jti (unique id).

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

// Issue an access token (short-lived) for authenticating API calls.
const signAccessToken = (user) => {
  const jti = uuidv4();
  const payload = {
    sub: user.id,
    type: 'access',
    jti,
    tokenVersion: user.tokenVersion,
  };
  const token = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
  const { exp } = jwt.decode(token); // unix seconds
  return { token, jti, exp };
};

// Issue a refresh token (long-lived) to re-issue access tokens later.
const signRefreshToken = (user) => {
  const jti = uuidv4();
  const payload = {
    sub: user.id,
    type: 'refresh',
    jti,
    tokenVersion: user.tokenVersion,
  };
  const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  const { exp } = jwt.decode(token);
  return { token, jti, exp };
};

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
