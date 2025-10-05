'use strict';

// Inserts a demo user with a properly hashed password so you can log in later.
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('S3cret!123', 12); // <-- change later
    await queryInterface.bulkInsert('users', [
      {
        email: 'demo@local.dev',
        password_hash: hash,
        token_version: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'demo@local.dev' });
  },
};
