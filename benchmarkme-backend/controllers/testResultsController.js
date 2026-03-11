const pool = require('../config/database');

const getValidatedUserId = (req) => {
  const rawUserId = req?.user?.id;
  const numericUserId = Number(rawUserId);

  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return null;
  }

  return numericUserId;
};

const runResultsQuerySafely = async (query, params, contextLabel) => {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      console.warn(`Trūkst tabula rezultātu pieprasījumam (${contextLabel}):`, error.sqlMessage);
      return [];
    }

    throw error;
  }
};

// ============ REAKCIJAS TESTS ============
const saveReactionResult = async (req, res) => {
  try {
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
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
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
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
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
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
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
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
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
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

// ============ STROOP TESTS ============
const saveStroopResult = async (req, res) => {
  try {
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
    const { score, metadata } = req.body;

    const totalTrials = metadata?.totalTrials ?? metadata?.total ?? score ?? 0;
    const correctCount = metadata?.correct ?? score ?? 0;
    const incorrectCount = metadata?.incorrect ?? Math.max(totalTrials - correctCount, 0);
    const accuracy = metadata?.accuracy ?? (totalTrials > 0 ? Math.round((correctCount / totalTrials) * 100) : 0);
    const averageTimeMs = metadata?.averageTimeMs ?? metadata?.avgReactionTime ?? null;

    await pool.query(
      `INSERT INTO stroop_results 
       (user_id, total_trials, correct_count, incorrect_count, accuracy_percent, average_time_ms) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, totalTrials, correctCount, incorrectCount, accuracy, averageTimeMs]
    );

    res.status(201).json({ message: 'Stroop rezultāts saglabāts!' });
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({ error: 'Stroop tabula nav atrasta datubāzē. Importē jaunāko benchmarkme.sql.' });
    }
    console.error('Kļūda saglabājot Stroop rezultātu:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// ============ IEGŪT REZULTĀTUS ============
const getTestResults = async (req, res) => {
  try {
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }
    const { testType } = req.params;

    const tableMap = {
      'reaction': 'reaction_results',
      'memory': 'memory_results',
      'number-memory': 'number_memory_results',
      'typing': 'typing_results',
      'aim': 'aim_results',
      'stroop': 'stroop_results'
    };

    const tableName = tableMap[testType];
    
    if (!tableName) {
      return res.status(400).json({ error: 'Nezināms testa tips' });
    }

    const results = await runResultsQuerySafely(
      `SELECT * FROM ${tableName} WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId],
      `getTestResults:${testType}`
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
    const userId = getValidatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Nederīga autorizācija. Pieslēdzies vēlreiz.' });
    }

    const [reaction, memory, numberMemory, typing, aim, stroop] = await Promise.all([
      runResultsQuerySafely(
        `SELECT id, user_id, reaction_time_ms as score, 'reaction' as test_type, created_at FROM reaction_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:reaction'
      ),
      runResultsQuerySafely(
        `SELECT id, user_id, total_correct as score, 'memory' as test_type, created_at FROM memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:memory'
      ),
      runResultsQuerySafely(
        `SELECT id, user_id, correct_answers as score, 'number_memory' as test_type, created_at FROM number_memory_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:number_memory'
      ),
      runResultsQuerySafely(
        `SELECT id, user_id, wpm as score, 'typing' as test_type, created_at FROM typing_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:typing'
      ),
      runResultsQuerySafely(
        `SELECT id, user_id, accuracy_percent as score, 'aim' as test_type, created_at FROM aim_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:aim'
      ),
      runResultsQuerySafely(
        `SELECT id, user_id, correct_count as score, 'stroop' as test_type, created_at FROM stroop_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
        [userId],
        'getAllResults:stroop'
      )
    ]);

    // Combine all results into a single flat array
    const allResults = [...reaction, ...memory, ...numberMemory, ...typing, ...aim, ...stroop]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allResults);
  } catch (error) {
    console.error('Kļūda iegūstot visus rezultātus:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Iegūt publiskos jaunākos rezultātus ar lietotājvārdiem (leaderboard bloks)
const getRecentResults = async (req, res) => {
  try {
    const requestedLimit = Number(req.query?.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 20;

    const rows = await runResultsQuerySafely(
      `SELECT
        recent.id,
        recent.user_id,
        recent.test_type,
        recent.score,
        recent.created_at,
        COALESCE(NULLIF(u.username, ''), CONCAT('user', u.id)) AS username
      FROM (
        SELECT id, user_id, 'reaction' AS test_type, reaction_time_ms AS score, created_at FROM reaction_results
        UNION ALL
        SELECT id, user_id, 'memory' AS test_type, total_correct AS score, created_at FROM memory_results
        UNION ALL
        SELECT id, user_id, 'number_memory' AS test_type, correct_answers AS score, created_at FROM number_memory_results
        UNION ALL
        SELECT id, user_id, 'typing' AS test_type, wpm AS score, created_at FROM typing_results
        UNION ALL
        SELECT id, user_id, 'aim' AS test_type, accuracy_percent AS score, created_at FROM aim_results
        UNION ALL
        SELECT id, user_id, 'stroop' AS test_type, correct_count AS score, created_at FROM stroop_results
      ) AS recent
      INNER JOIN users u ON u.id = recent.user_id
      ORDER BY recent.created_at DESC
      LIMIT ?`,
      [limit],
      'getRecentResults'
    );

    res.json(rows);
  } catch (error) {
    console.error('Kļūda iegūstot publiskos rezultātus:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

// Iegūt leaderboard ar labāko rezultātu katram lietotājam izvēlētajā testā
const getLeaderboard = async (req, res) => {
  try {
    const testType = String(req.query?.testType || 'typing');
    const requestedLimit = Number(req.query?.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 10;

    const leaderboardMap = {
      reaction: {
        table: 'reaction_results',
        scoreExpr: 'MIN(r.reaction_time_ms)',
        sortDirection: 'ASC'
      },
      memory: {
        table: 'memory_results',
        scoreExpr: 'MAX(r.total_correct)',
        sortDirection: 'DESC'
      },
      number_memory: {
        table: 'number_memory_results',
        scoreExpr: 'MAX(r.correct_answers)',
        sortDirection: 'DESC'
      },
      typing: {
        table: 'typing_results',
        scoreExpr: 'MAX(r.wpm)',
        sortDirection: 'DESC'
      },
      aim: {
        table: 'aim_results',
        scoreExpr: 'MAX(r.accuracy_percent)',
        sortDirection: 'DESC'
      },
      stroop: {
        table: 'stroop_results',
        scoreExpr: 'MAX(r.correct_count)',
        sortDirection: 'DESC'
      }
    };

    const selected = leaderboardMap[testType];
    if (!selected) {
      return res.status(400).json({ error: 'Nezināms leaderboard testa tips' });
    }

    const rows = await runResultsQuerySafely(
      `SELECT
        u.id AS user_id,
        COALESCE(NULLIF(u.username, ''), CONCAT('user', u.id)) AS username,
        ${selected.scoreExpr} AS best_score,
        MAX(r.created_at) AS last_played_at
      FROM ${selected.table} r
      INNER JOIN users u ON u.id = r.user_id
      GROUP BY u.id, u.username
      ORDER BY best_score ${selected.sortDirection}, last_played_at DESC
      LIMIT ?`,
      [limit],
      `getLeaderboard:${testType}`
    );

    res.json({ testType, limit, results: rows });
  } catch (error) {
    console.error('Kļūda iegūstot leaderboard:', error);
    res.status(500).json({ error: 'Servera kļūda' });
  }
};

module.exports = {
  saveReactionResult,
  saveMemoryResult,
  saveNumberMemoryResult,
  saveTypingResult,
  saveAimResult,
  saveStroopResult,
  getTestResults,
  getAllResults,
  getRecentResults,
  getLeaderboard
};
