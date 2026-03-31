/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: PROFILES.JS - PROFILU MARŠRUTI
 * APRAKSTS: LIETOTĀJA PROFILA API MARŠRUTU DEFINĪCIJAS -
 *           PROFILA IEGŪŠANA UN ATJAUNINĀŠANA
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profilesController');

router.use(authenticateToken);

router.get('/', getProfile);
router.put('/', updateProfile);

module.exports = router;
