const mysql = require('mysql2/promise');
require('dotenv').config();

// Izveido savienojumu
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ir vai nav kļūda
pool.getConnection()
  .then(connection => {
    console.log('Datubāze savienota');
    connection.release();
  })
  .catch(err => {
    console.error('Datubāzes kļūda:', err.message);
  });

module.exports = pool;
