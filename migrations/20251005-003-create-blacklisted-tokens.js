'use strict';

// Access token blacklist table; holds JTI until expiry.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blacklisted_tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      jti: { type: Sequelize.STRING, allowNull: false, unique: true },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      reason: { type: Sequelize.STRING, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('blacklisted_tokens', ['expires_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('blacklisted_tokens');
  },
};
