// Access token blacklist: store JTI (unique ID) until it expires.
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlacklistedToken = sequelize.define(
    'BlacklistedToken',
    {
      jti: { type: DataTypes.STRING, unique: true, allowNull: false }, // token's unique id
      expiresAt: { type: DataTypes.DATE, allowNull: false }, // drop after this date
      reason: { type: DataTypes.STRING, allowNull: true }, // e.g., logout/admin_revoke
    },
    {
      tableName: 'blacklisted_tokens',
      underscored: true,
      indexes: [{ fields: ['expires_at'] }],
    }
  );

  return BlacklistedToken;
};
