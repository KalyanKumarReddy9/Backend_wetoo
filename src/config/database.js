const { Sequelize } = require('sequelize');
require('dotenv').config();

function createSequelizeInstance() {
  console.log('DB Config:', {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'wetoo',
    username: process.env.DB_USER || 'wetoo_user',
    password: process.env.DB_PASS || '',
  });
  
  const common = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  };

  const db = new Sequelize(
    process.env.DB_NAME || 'wetoo',
    process.env.DB_USER || 'wetoo_user',
    process.env.DB_PASS || '',
    common
  );

  return db;
}

module.exports = { createSequelizeInstance };