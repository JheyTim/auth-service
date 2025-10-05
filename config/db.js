// Programmatic Sequelize init for the running app (Express).
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // toggle true to see SQL in console
});

module.exports = { sequelize };
