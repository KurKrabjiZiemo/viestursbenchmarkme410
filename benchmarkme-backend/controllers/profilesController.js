const pool = require('../config/database');

// Iegūt profilu
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [profiles] = await pool.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profils nav atrasts' });
    }

    res.json({ profile: profiles[0] });
  } catch (error) {
    console.error('Kļūda iegūstot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Atjaunot profilu
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, avatar_url } = req.body;

    await pool.query(
      'UPDATE profiles SET username = ?, avatar_url = ? WHERE user_id = ?',
      [username, avatar_url, userId]
    );

    const [profiles] = await pool.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profils atjaunots!',
      profile: profiles[0] 
    });
  } catch (error) {
    console.error('Kļūda atjaunojot profilu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

module.exports = { getProfile, updateProfile };
