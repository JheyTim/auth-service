// Admin maintenance actions. Guarded by adminAuth middleware.
// Warning: keep these endpoints secure and audit their usage.
const { User, RefreshToken } = require('../models');

const findUserByEmailOrId = async (identifier) => {
  if (!identifier) return null;
  if (/^\d+$/.test(identifier)) {
    return User.findByPk(Number(identifier));
  }
  return User.findOne({ where: { email: identifier } });
};

exports.adminGlobalRevoke = async (req, res, next) => {
  try {
    const { user: ident } = req.body || {};

    const user = await findUserByEmailOrId(ident);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.tokenVersion += 1;
    await user.save();
    await RefreshToken.destroy({ where: { userId: user.id } });

    res.json({ ok: true, userId: user.id, tokenVersion: user.tokenVersion });
  } catch (err) {
    next(err);
  }
};

exports.adminListSessions = async (req, res, next) => {
  try {
    const ident = req.query.user;
    const user = await findUserByEmailOrId(ident);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const rows = await RefreshToken.findAll({
      where: { userId: user.id },
      attributes: ['id', 'expiresAt', 'meta', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ userId: user.id, count: rows.length, sessions: rows });
  } catch (err) {
    next(err);
  }
};

exports.adminDeleteSessions = async (req, res, next) => {
  try {
    const { user: ident } = req.body || {};
    const user = await findUserByEmailOrId(ident);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const n = await RefreshToken.destroy({ where: { userId: user.id } });
    res.json({ ok: true, userId: user.id, deleted: n });
  } catch (err) {
    next(err);
  }
};
