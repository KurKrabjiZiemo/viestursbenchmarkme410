/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: AUTHCONTROLLER.JS - AUTENTIFIKĀCIJAS KONTROLIERIS
 * APRAKSTS: LIETOTĀJU REĢISTRĀCIJAS, PIETEIKŠANĀS, SESIJAS PĀRBAUDES
 *           UN IZRAKSTĪŠANĀS LOĢIKAS APSTRĀDE
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  profile_picture: user.profile_picture,
  created_at: user.created_at,
});

// Reģistrācija - izveido jaunu lietotāju
const signUp = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const normalizedUsername = String(username || '').trim();

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Lietotājvārdam ir jābūt aizpildītam' });
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
      return res.status(400).json({ error: 'Lietotājvārdam jābūt no 3 līdz 50 rakstzīmēm' });
    }

    // Pārbauda vai e-pasts jau eksistē
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Lietotājs ar šo e-pastu jau eksistē' });
    }

    const [existingUsernames] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [normalizedUsername]
    );

    if (existingUsernames.length > 0) {
      return res.status(400).json({ error: 'Šis lietotājvārds jau tiek izmantots' });
    }

    // Šifrē paroli
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Izveido lietotāju (UUID tiks ģenerēts ar triggeru)
    const [result] = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [email, normalizedUsername, passwordHash]
    );

    // Iegūst jaunizveidoto lietotāju
    const [users] = await pool.query(
      'SELECT id, email, username, profile_picture, created_at FROM users WHERE email = ?',
      [email]
    );

    const user = users[0];

    // Izveido JWT tokenu
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Konts izveidots veiksmīgi!',
      user: buildUserPayload(user),
      token
    });

  } catch (error) {
    console.error('Reģistrācijas kļūda:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Pieteikšanās - autentificē lietotāju
const signIn = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const normalizedIdentifier = String(identifier || '').trim();

    if (!normalizedIdentifier) {
      return res.status(400).json({ error: 'Ievadi e-pastu vai lietotājvārdu' });
    }

    // Meklē lietotāju pēc e-pasta vai lietotājvārda
    const [users] = await pool.query(
      'SELECT id, email, username, profile_picture, password_hash, created_at FROM users WHERE email = ? OR username = ? LIMIT 1',
      [normalizedIdentifier, normalizedIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Nepareizs e-pasts/lietotājvārds vai parole' });
    }

    const user = users[0];

    // Salīdzina paroli
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nepareizs e-pasts/lietotājvārds vai parole' });
    }

    // Izveido JWT tokenu
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Pieteikšanās veiksmīga!',
      user: buildUserPayload(user),
      token
    });

  } catch (error) {
    console.error('Pieteikšanās kļūda:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Pārbauda sesiju - vai tokens ir derīgs
const getSession = async (req, res) => {
  try {
    // req.user tiek uzstādīts middleware
    const [users] = await pool.query(
      'SELECT id, email, username, profile_picture, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Lietotājs nav atrasts' });
    }

    res.json({ user: buildUserPayload(users[0]) });

  } catch (error) {
    console.error('Sesijas kļūda:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Izrakstīšanās (frontend vienkārši dzēš tokenu)
const signOut = (req, res) => {
  res.json({ message: 'Izrakstīšanās veiksmīga!' });
};

module.exports = { signUp, signIn, getSession, signOut };
