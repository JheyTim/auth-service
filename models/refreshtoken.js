// Refresh tokens are stored as **hashes** to be safe even if DB leaks.
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      tokenHash: { type: DataTypes.STRING, allowNull: false }, // bcrypt hash of the refresh token
      expiresAt: { type: DataTypes.DATE, allowNull: false }, // when this token dies
      meta: { type: DataTypes.JSONB, allowNull: true }, // device info, IP, etc.
    },
    {
      tableName: 'refresh_tokens',
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
    }
  );

  return RefreshToken;
};
