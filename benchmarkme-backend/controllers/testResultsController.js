const pool = require('../config/database');

// ============ REAKCIJAS TESTS ============
const saveReactionResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reaction_time_ms, attempts_count, best_time_ms, average_time_ms, all_attempts } = req.body;

    await pool.query(
      `INSERT INTO reaction_results 
       (user_id, reaction_time_ms, attempts_count, best_time_ms, average_time_ms, all_attempts) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, reaction_time_ms, attempts_count, best_time_ms, average_time_ms, JSON.stringify(all_attempts)]
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
    const { level_reached, total_score, accuracy_percentage, sequence_length, correct_tiles, total_tiles } = req.body;

    await pool.query(
      `INSERT INTO memory_results 
       (user_id, level_reached, total_score, accuracy_percentage, sequence_length, correct_tiles, total_tiles) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, level_reached, total_score, accuracy_percentage, sequence_length, correct_tiles, total_tiles]
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
    const { highest_level, total_score, accuracy_percentage, digits_remembered, total_attempts } = req.body;

    await pool.query(
      `INSERT INTO number_memory_results 
       (user_id, highest_level, total_score, accuracy_percentage, digits_remembered, total_attempts) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, highest_level, total_score, accuracy_percentage, digits_remembered, total_attempts]
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
    const { wpm, accuracy_percentage, characters_typed, errors_count, test_duration_seconds } = req.body;

    await pool.query(
      `INSERT INTO typing_results 
       (user_id, wpm, accuracy_percentage, characters_typed, errors_count, test_duration_seconds) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, wpm, accuracy_percentage, characters_typed, errors_count, test_duration_seconds]
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
    const { average_time_ms, best_time_ms, total_targets, hits, misses, accuracy_percentage } = req.body;

    await pool.query(
      `INSERT INTO aim_results 
       (user_id, average_time_ms, best_time_ms, total_targets, hits, misses, accuracy_percentage) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, average_time_ms, best_time_ms, total_targets, hits, misses, accuracy_percentage]
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

    const [reaction] = await pool.query('SELECT *, "reaction" as test_type FROM reaction_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const [memory] = await pool.query('SELECT *, "memory" as test_type FROM memory_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const [numberMemory] = await pool.query('SELECT *, "number-memory" as test_type FROM number_memory_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const [typing] = await pool.query('SELECT *, "typing" as test_type FROM typing_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const [aim] = await pool.query('SELECT *, "aim" as test_type FROM aim_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    res.json({
      results: {
        reaction,
        memory,
        numberMemory,
        typing,
        aim
      }
    });
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
