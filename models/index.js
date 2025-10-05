// Central model registry for the app.
const { sequelize } = require('../config/db');

// Import model factories:
const defineUser = require('./user');
const defineRefreshToken = require('./refreshtoken');
const defineBlacklistedToken = require('./blacklistedtoken');

// Initialize models with the shared sequelize instance:
const User = defineUser(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const BlacklistedToken = defineBlacklistedToken(sequelize);

// Associations:
// 1 user : many refresh tokens (one per device/session)
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  BlacklistedToken,
};
