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
