/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: PROFILESCONTROLLER.JS - PROFILU KONTROLIERIS
 * APRAKSTS: LIETOTĀJA PROFILA DATU IEGŪŠANA UN ATJAUNINĀŠANA,
 *           IETVER LIETOTĀJVĀRDA MAIŅAS FUNKCIONALITĀTI
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
const pool = require('../config/database');

// Iegūt profilu
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Profils nav atrasts' });
    }

    res.json({ profile: users[0] });
  } catch (error) {
    console.error('Kļūda iegūstot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Atjaunot profilu
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    const normalizedUsername = String(username || '').trim();

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

    await pool.query(
      'UPDATE users SET username = ? WHERE id = ?',
      [normalizedUsername, userId]
    );

    const [users] = await pool.query(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profils atjaunots!',
      profile: users[0] 
    });
  } catch (error) {
    console.error('Kļūda atjaunojot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

module.exports = { getProfile, updateProfile };
