// Register + Login handlers.
// - register: creates a user with a bcrypt-hashed password
// - login: verifies password, issues access token (JSON) + refresh token (httpOnly cookie)
const { User, RefreshToken } = require('../models');
const {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} = require('../utils/jwt');
const { hashToken, expToDate, compareToken } = require('../utils/crypto');

const COOKIE_NAME = process.env.COOKIE_NAME || 'rt';
const COOKIE_OPTIONS = {
  httpOnly: true, // JS cannot read it (XSS safety)
  secure: process.env.COOKIE_SECURE === 'true', // true in prod (HTTPS)
  sameSite: 'strict',
  domain: process.env.COOKIE_DOMAIN || 'localhost',
  path: '/auth/refresh',
};

const setRefreshCookie = (res, token, expUnix) => {
  res.cookie(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    expires: new Date(expUnix * 1000),
  });
};

exports.register = async (req, res, next) => {
  try {
    // Basic input validation (keep messages generic to avoid user enumeration)
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    // Create user and hash password via model helper
    const user = await User.create({ email, passwordHash: 'temp' });
    await user.setPassword(password);
    await user.save();

    // Don’t log the user in automatically (safer defaults); return minimal info
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, device } = req.body || {};

    // Find User
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check password
    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Issue Tokens
    const { token: accessToken, exp: accessExp } = signAccessToken(user);
    const { token: refreshToken, exp: refreshExp } = signRefreshToken(user);

    //Store **hashed** refresh token for this session
    const tokenHash = await hashToken(refreshToken);
    await RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt: expToDate(refreshExp),
      meta: { device: device || 'unknown' },
    });

    // Set refresh cookie, return access token to client
    setRefreshCookie(res, refreshToken, refreshExp);
    return res.status(200).json({ accessToken, expiresAt: accessExp });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    // Pull refresh token from httpOnly cookie'
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    // Verify signature/expiry (reject if tampered/expired)
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (_e) {
      return res
        .status(401)
        .json({ error: 'Invalid or expired refresh token' });
    }

    // Find the matching stored hash for this user (rotation guard)
    // We never store plaintext refresh tokens, so we must bcrypt-compare.
    const candidates = await RefreshToken.findAll({
      where: { userId: payload.sub },
    });

    let record = null;
    for (const r of candidates) {
      if (await compareToken(token, r.tokenHash)) {
        record = r;
        break;
      }
    }

    if (!record) {
      //  Reuse detection: token is valid (signature OK) but not present in DB.
      // That means it was already rotated (or stolen). Revoke all sessions.
      await RefreshToken.destroy({ where: { userId: payload.sub } });
      return res
        .status(401)
        .json({ error: 'Refresh token reuse detected. Please log in again.' });
    }

    // Optional: enforce tokenVersion so admins can globally revoke sessions
    const user = await User.findByPk(payload.sub);
    if (!user || payload.tokenVersion !== user.tokenVersion) {
      // destroy this record to be safe
      await record.destroy().catch(() => {});
      return res
        .status(401)
        .json({ error: 'Session expired. Please log in again.' });
    }

    //  ROTATION: destroy the old record so it cannot be reused
    await record.destroy();

    // Issue fresh pair
    const { token: accessToken, exp: accessExp } = signAccessToken(user);
    const { token: newRefreshToken, exp: refreshExp } = signRefreshToken(user);

    //  Store hashed new refresh token
    const newHash = await hashToken(newRefreshToken);
    await RefreshToken.create({
      userId: user.id,
      tokenHash: newHash,
      expiresAt: expToDate(refreshExp),
      meta: { rotatedFrom: 'phase3' },
    });

    //  Clear any old wide-path cookie, then set scoped cookie
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, path: '/' }); // clear legacy cookie
    setRefreshCookie(res, newRefreshToken, refreshExp);

    //  Return new access token
    return res.status(200).json({ accessToken, expiresAt: accessExp });
  } catch (err) {
    next(err);
  }
};
