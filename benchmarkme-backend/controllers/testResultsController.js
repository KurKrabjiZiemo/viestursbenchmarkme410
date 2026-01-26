const pool = require('../config/database');

// ============ REAKCIJAS TESTS ============
const saveReactionResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;
    
    // score = reaction_time_ms, metadata = { attempts, averageTime }
    const attempts = metadata?.attempts || [];
    const averageTime = metadata?.averageTime || score;

    await pool.query(
      `INSERT INTO reaction_results 
       (user_id, reaction_time_ms, attempts_count, best_time_ms, average_time_ms, all_attempts) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, score, attempts.length, Math.min(...attempts, score), averageTime, JSON.stringify(attempts)]
    );

    res.status(201).json({ message: 'Reakcijas rezultāts saglabāts!' });
  } catch (error) {
    console.error('Kļūda saglabājot reakcijas rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ VIZUĀLĀS ATMIŅAS TESTS ============
const saveMemoryResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;
    
    // score = total_score, metadata = { level, accuracy, isCorrect }
    const level = metadata?.level || 1;
    const accuracy = metadata?.accuracy || 100;

    await pool.query(
      `INSERT INTO memory_results 
       (user_id, level_reached, total_score, accuracy_percentage, sequence_length, correct_tiles, total_tiles) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, level, score, accuracy, level * 4, Math.round((accuracy / 100) * level * 4), level * 4]
    );

    res.status(201).json({ message: 'Atmiņas rezultāts saglabāts!' });
  } catch (error) {
    console.error('Kļūda saglabājot atmiņas rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ SKAITĻU ATMIŅAS TESTS ============
const saveNumberMemoryResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;
    
    // score = total_score, metadata = { level, isCorrect, totalAttempts }
    const level = metadata?.level || 1;
    const totalAttempts = metadata?.totalAttempts || 1;
    const accuracy = metadata?.isCorrect ? 100 : 0;

    await pool.query(
      `INSERT INTO number_memory_results 
       (user_id, highest_level, total_score, accuracy_percentage, digits_remembered, total_attempts) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, level, score, accuracy, Math.min(3 + level, 15), totalAttempts]
    );

    res.status(201).json({ message: 'Skaitļu atmiņas rezultāts saglabāts!' });
  } catch (error) {
    console.error('Kļūda saglabājot skaitļu atmiņas rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ RAKSTĪŠANAS TESTS ============
const saveTypingResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;
    
    // score = wpm, metadata = { wpm, accuracy }
    const wpm = score;
    const accuracy = metadata?.accuracy || 100;

    await pool.query(
      `INSERT INTO typing_results 
       (user_id, wpm, accuracy_percentage, characters_typed, errors_count, test_duration_seconds) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, wpm, accuracy, 0, 0, 60]
    );

    res.status(201).json({ message: 'Rakstīšanas rezultāts saglabāts!' });
  } catch (error) {
    console.error('Kļūda saglabājot rakstīšanas rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ PRECIZITĀTES TESTS ============
const saveAimResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;
    
    // score = total_score, metadata = { accuracy, avgReactionTime, hits, misses }
    const accuracy = metadata?.accuracy || 0;
    const avgReactionTime = metadata?.avgReactionTime || 0;
    const hits = metadata?.hits || 0;
    const misses = metadata?.misses || 0;

    await pool.query(
      `INSERT INTO aim_results 
       (user_id, average_time_ms, best_time_ms, total_targets, hits, misses, accuracy_percentage) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, avgReactionTime, avgReactionTime, hits + misses, hits, misses, accuracy]
    );

    res.status(201).json({ message: 'Precizitātes rezultāts saglabāts!' });
  } catch (error) {
    console.error('Kļūda saglabājot precizitātes rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ IEGŪT REZULTĀTUS ============
const getTestResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { testType } = req.params;

    const tableMap = {
      'reaction': 'reaction_results',
      'memory': 'memory_results',
      'number-memory': 'number_memory_results',
      'typing': 'typing_results',
      'aim': 'aim_results'
    };

    const tableName = tableMap[testType];
    
    if (!tableName) {
      return res.status(400).json({ error: 'Nezināms testa tips' });
    }

    const [results] = await pool.query(
      `SELECT * FROM ${tableName} WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({ results });
  } catch (error) {
    console.error('Kļūda iegūstot rezultātus:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Iegūt visus rezultātus (priekš dashboard)
const getAllResults = async (req, res) => {
  try {
    const userId = req.user.id;

    const [reaction] = await pool.query(
      `SELECT id, user_id, reaction_time_ms as score, 'reaction' as test_type, created_at FROM reaction_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [memory] = await pool.query(
      `SELECT id, user_id, total_score as score, 'memory' as test_type, created_at FROM memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [numberMemory] = await pool.query(
      `SELECT id, user_id, total_score as score, 'number_memory' as test_type, created_at FROM number_memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [typing] = await pool.query(
      `SELECT id, user_id, wpm as score, 'typing' as test_type, created_at FROM typing_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [aim] = await pool.query(
      `SELECT id, user_id, accuracy_percentage as score, 'aim' as test_type, created_at FROM aim_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );

    // Combine all results into a single flat array
    const allResults = [...reaction, ...memory, ...numberMemory, ...typing, ...aim]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allResults);
  } catch (error) {
    console.error('Kļūda iegūstot visus rezultātus:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

module.exports = {
  saveReactionResult,
  saveMemoryResult,
  saveNumberMemoryResult,
  saveTypingResult,
  saveAimResult,
  getTestResults,
  getAllResults
};
