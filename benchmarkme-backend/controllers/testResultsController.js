const pool = require('../config/database');

// ============ REAKCIJAS TESTS ============
const saveReactionResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, metadata } = req.body;

    // Adapt to current schema: store one row per attempt
    const attempts = metadata?.attempts || [];
    const attemptNumber = (metadata?.attemptIndex ?? attempts.length) || 1;
    const best = attempts.length ? Math.min(...attempts, score) : score;
    const isBest = score <= best ? 1 : 0;

    await pool.query(
      `INSERT INTO reaction_results 
       (user_id, reaction_time_ms, attempt_number, is_best) 
       VALUES (?, ?, ?, ?)`,
      [userId, score, attemptNumber, isBest]
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

    // Adapt to current memory_results schema
    const level = metadata?.level || 1;
    const accuracy = metadata?.accuracy ?? 100;
    const gridSize = level * 4;
    const totalCorrect = Math.round((accuracy / 100) * gridSize) || 0;
    const totalMistakes = gridSize - totalCorrect;

    await pool.query(
      `INSERT INTO memory_results 
       (user_id, level_reached, total_correct, total_mistakes, grid_size, tiles_to_remember, accuracy_percent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, level, totalCorrect, totalMistakes, gridSize, gridSize, accuracy]
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

    // Adapt to current number_memory_results schema
    const level = metadata?.level || 1;
    const digitsRemembered = Math.min(3 + level, 15);
    const correctAnswers = metadata?.correctAnswers ?? (metadata?.isCorrect ? 1 : 0);
    const wrongNumber = metadata?.wrongNumber || null;
    const correctNumber = metadata?.correctNumber || null;

    await pool.query(
      `INSERT INTO number_memory_results 
       (user_id, level_reached, digits_remembered, correct_answers, wrong_number, correct_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, level, digitsRemembered, correctAnswers, wrongNumber, correctNumber]
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

    // Adapt to typing_results schema
    const wpm = score;
    const cpm = metadata?.cpm ?? Math.round(wpm * 5);
    const accuracy = metadata?.accuracy ?? 100;
    const totalChars = metadata?.totalChars ?? Math.round((cpm / 60) * (metadata?.testDurationSeconds || 60));
    const correctChars = Math.round((accuracy / 100) * totalChars) || 0;
    const incorrectChars = totalChars - correctChars;
    const duration = metadata?.testDurationSeconds ?? 60;

    await pool.query(
      `INSERT INTO typing_results 
       (user_id, wpm, cpm, accuracy_percent, correct_chars, incorrect_chars, total_chars, test_duration_seconds) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, wpm, cpm, accuracy, correctChars, incorrectChars, totalChars, duration]
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

    // Map to current aim_results schema
    const accuracy = metadata?.accuracy ?? 0;
    const avgReactionTime = metadata?.avgReactionTime ?? 0;
    const hits = metadata?.hits ?? 0;
    const misses = metadata?.misses ?? 0;
    const totalTargets = hits + misses;
    const best = metadata?.bestTime ?? avgReactionTime;
    const worst = metadata?.worstTime ?? null;
    const totalTime = metadata?.totalTimeMs ?? null;

    await pool.query(
      `INSERT INTO aim_results 
       (user_id, total_targets, targets_hit, targets_missed, average_time_ms, best_time_ms, worst_time_ms, accuracy_percent, total_time_ms) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, totalTargets, hits, misses, avgReactionTime, best, worst, accuracy, totalTime]
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
      `SELECT id, user_id, total_correct as score, 'memory' as test_type, created_at FROM memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [numberMemory] = await pool.query(
      `SELECT id, user_id, correct_answers as score, 'number_memory' as test_type, created_at FROM number_memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [typing] = await pool.query(
      `SELECT id, user_id, wpm as score, 'typing' as test_type, created_at FROM typing_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const [aim] = await pool.query(
      `SELECT id, user_id, accuracy_percent as score, 'aim' as test_type, created_at FROM aim_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
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
