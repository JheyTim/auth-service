// Session utilities for the *current user*.
// - GET /auth/sessions    -> list current user's refresh-token sessions
// - POST /auth/sessions/revoke-all -> bump tokenVersion + delete all RT rows

const { User, RefreshToken } = require('../models');

exports.listMySessions = async (req, res, next) => {
  try {
    const rows = await RefreshToken.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'expiresAt', 'meta', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      count: rows.length,
      sessions: rows.map((r) => ({
        id: r.id,
        // Do NOT expose token hashes.
        expiresAt: r.expiresAt,
        meta: r.meta || {},
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        active: r.expiresAt > new Date(),
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.revokeAllMySessions = async (req, res, next) => {
  try {
    // bump tokenVersion to instantly invalidate all access/refresh tokens
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.tokenVersion += 1;
    await user.save();

    // delete all refresh tokens for this user (so they cannot be refreshed)
    await RefreshToken.destroy({ where: { userId: user.id } });

    // Note: client should also delete its refresh cookie; but the cookie is bound
    // to /auth/refresh and will simply fail next time.
    res.json({ ok: true, tokenVersion: user.tokenVersion });
  } catch (err) {
    next(err);
  }
};
