const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware, kas pārbauda tokenu
const authenticateToken = (req, res, next) => {
  // Iegūst tokenu no Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // tokens

  // Ja nav tokena, atgriež kļūdu
  if (!token) {
    return res.status(401).json({ error: 'Piekļuve liegta. Nav tokena.' });
  }

  // Verificē tokenu
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Nederīgs vai beidzies tokens.' });
    }

    const numericUserId = Number(user?.id);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return res.status(401).json({ error: 'Nederīgs lietotāja tokens. Pieslēdzies vēlreiz.' });
    }
    
    // Pievieno lietotāja info pieprasījumam
    req.user = { ...user, id: numericUserId };
    next();
  });
};

module.exports = { authenticateToken };
