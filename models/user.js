// User model storing email + hashed password (never store plaintext).
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      // Used later to invalidate all refresh tokens if incremented
      tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: 'users',
      underscored: true, // snake_case columns, nicer for SQL
    }
  );

  // Helper method to set password with hashing
  User.prototype.setPassword = async function (plain) {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(plain, saltRounds);
  };

  // Verify password at login
  User.prototype.validatePassword = function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
  };

  return User;
};
