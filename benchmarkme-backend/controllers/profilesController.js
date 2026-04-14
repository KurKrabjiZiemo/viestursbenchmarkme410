/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: PROFILESCONTROLLER.JS - PROFILU KONTROLIERIS
 * APRAKSTS: LIETOTĀJA PROFILA DATU IEGŪŠANA UN ATJAUNINĀŠANA,
 *           IETVER LIETOTĀJVĀRDA MAIŅAS FUNKCIONALITĀTI
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const USER_SELECT_FIELDS = 'id, email, username, profile_picture, created_at, updated_at';

const getUserById = async (userId) => {
  const [users] = await pool.query(
    `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = ?`,
    [userId]
  );

  return users[0] || null;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidProfilePicture = (value) => {
  if (!value) {
    return true;
  }

  return /^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value);
};

const createToken = (user) => jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Iegūt profilu
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Profils nav atrasts' });
    }

    res.json({ profile: user });
  } catch (error) {
    console.error('Kļūda iegūstot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Atjaunot profilu
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, profilePicture } = req.body;
    const normalizedUsername = String(username || '').trim();
    const normalizedProfilePicture = String(profilePicture || '').trim();

    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Lietotājvārdam ir jābūt aizpildītam' });
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
      return res.status(400).json({ error: 'Lietotājvārdam jābūt no 3 līdz 50 rakstzīmēm' });
    }

    const [existingUsernames] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id <> ?',
      [normalizedUsername, userId]
    );

    if (existingUsernames.length > 0) {
      return res.status(400).json({ error: 'Šis lietotājvārds jau tiek izmantots' });
    }

    if (normalizedProfilePicture.length > 3000000) {
      return res.status(400).json({ error: 'Profila bilde ir pārāk liela' });
    }

    if (!isValidProfilePicture(normalizedProfilePicture)) {
      return res.status(400).json({ error: 'Profila bildei jābūt derīgam attēla URL vai augšupielādētam attēlam' });
    }

    await pool.query(
      'UPDATE users SET username = ?, profile_picture = ? WHERE id = ?',
      [normalizedUsername, normalizedProfilePicture || null, userId]
    );

    const user = await getUserById(userId);

    res.json({ 
      message: 'Profils atjaunots!',
      profile: user 
    });
  } catch (error) {
    console.error('Kļūda atjaunojot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

const updateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, currentPassword } = req.body;
    const normalizedEmail = String(newEmail || '').trim().toLowerCase();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Ievadi derīgu e-pasta adresi' });
    }

    if (!currentPassword) {
      return res.status(400).json({ error: 'Ievadi pašreizējo paroli' });
    }

    const [users] = await pool.query(
      'SELECT id, email, username, profile_picture, password_hash, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Lietotājs nav atrasts' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nepareiza pašreizējā parole' });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({ error: 'Jaunais e-pasts sakrīt ar esošo' });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [normalizedEmail, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Lietotājs ar šo e-pastu jau eksistē' });
    }

    await pool.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [normalizedEmail, userId]
    );

    const updatedUser = await getUserById(userId);
    const token = createToken(updatedUser);

    res.json({
      message: 'E-pasts atjaunots!',
      profile: updatedUser,
      token
    });
  } catch (error) {
    console.error('Kļūda atjaunojot e-pastu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Ievadi pašreizējo paroli' });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Jaunajai parolei jābūt vismaz 6 rakstzīmes garai' });
    }

    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Lietotājs nav atrasts' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nepareiza pašreizējā parole' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);

    if (isSamePassword) {
      return res.status(400).json({ error: 'Jaunā parole nedrīkst sakrist ar esošo' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    res.json({ message: 'Parole atjaunota!' });
  } catch (error) {
    console.error('Kļūda atjaunojot paroli:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

module.exports = { getProfile, updateProfile, updateEmail, updatePassword };
