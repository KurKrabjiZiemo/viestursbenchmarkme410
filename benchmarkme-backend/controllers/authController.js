const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Reģistrācija - izveido jaunu lietotāju
const signUp = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Pārbauda vai e-pasts jau eksistē
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Lietotājs ar šo e-pastu jau eksistē' });
    }

    // Šifrē paroli
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Izveido lietotāju (UUID tiks ģenerēts ar triggeru)
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );

    // Iegūst jaunizveidoto lietotāju
    const [users] = await pool.query(
      'SELECT id, email, created_at FROM users WHERE email = ?',
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
      user: { id: user.id, email: user.email },
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
    const { email, password } = req.body;

    // Meklē lietotāju pēc e-pasta
    const [users] = await pool.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Nepareizs e-pasts vai parole' });
    }

    const user = users[0];

    // Salīdzina paroli
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nepareizs e-pasts vai parole' });
    }

    // Izveido JWT tokenu
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Pieteikšanās veiksmīga!',
      user: { id: user.id, email: user.email, created_at: user.created_at },
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
      'SELECT id, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Lietotājs nav atrasts' });
    }

    res.json({ user: users[0] });

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
