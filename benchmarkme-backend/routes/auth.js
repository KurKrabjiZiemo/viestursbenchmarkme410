/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: AUTH.JS - AUTENTIFIKĀCIJAS MARŠRUTI
 * APRAKSTS: AUTENTIFIKĀCIJAS API MARŠRUTU DEFINĪCIJAS -
 *           REĢISTRĀCIJA, PIETEIKŠANĀS, SESIJA UN IZRAKSTĪŠANĀS
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
const express = require('express');
const router = express.Router();
const { signUp, signIn, getSession, signOut } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Publiski maršruti
router.post('/signup', signUp);
router.post('/signin', signIn);

// Aizsargāti maršruti
router.get('/session', authenticateToken, getSession);
router.post('/signout', authenticateToken, signOut);

module.exports = router;
