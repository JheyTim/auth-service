// Register + Login handlers.
// - register: creates a user with a bcrypt-hashed password
// - login: verifies password, issues access token (JSON) + refresh token (httpOnly cookie)
const { User, RefreshToken } = require('../models');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { hashToken, expToDate } = require('../utils/crypto');
const { where } = require('sequelize');

const COOKIE_NAME = process.env.COOKIE_NAME || 'rt';
const COOKIE_OPTIONS = {
  httpOnly: true, // JS cannot read it (XSS safety)
  secure: process.env.COOKIE_SECURE === 'true', // true in prod (HTTPS)
  sameSite: 'strict',
  domain: process.env.COOKIE_DOMAIN || 'localhost',
  path: '/',
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
