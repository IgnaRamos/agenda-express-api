const mysql = require('mysql2/promise');  
require('dotenv').config();

let connection;

async function initDB() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT, 
    });
    console.log(' Conectado a la base de datos MySQL');
  } catch (error) {
    console.error(' Error conectando a la base de datos:', error);
    process.exit(1);
  }
}

initDB();

module.exports = {
  getConnection: () => connection,
};
