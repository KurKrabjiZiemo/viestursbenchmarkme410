/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: DATABASE.JS - DATUBĀZES KONFIGURĀCIJAS FAILS
 * APRAKSTS: MYSQL DATUBĀZES SAVIENOJUMA IZVEIDE UN PĀRVALDĪBA,
 *           IZMANTO SAVIENOJUMU PŪLU EFEKTĪVAI DARBĪBAI
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
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

const ensureSchema = async () => {
  try {
    await pool.query(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS username VARCHAR(50) NULL UNIQUE AFTER email`
    );

    await pool.query(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT NULL AFTER username`
    );
  } catch (error) {
    console.error('Kļūda atjaunojot users shēmu:', error.message);
  }
};

// Ir vai nav kļūda
pool.getConnection()
  .then(connection => {
    console.log('Datubāze savienota');
    connection.release();
    ensureSchema();
  })
  .catch(err => {
    console.error('Datubāzes kļūda:', err.message);
  });

module.exports = pool;
