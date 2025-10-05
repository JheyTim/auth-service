// Small, env-first Sequelize CLI config.
// The CLI only needs dialect + connection info.
require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {},
    logging: false,
  },
  test: {
    url:
      process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/authdb_test',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
  },
};
