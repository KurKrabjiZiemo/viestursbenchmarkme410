const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  saveReactionResult,
  saveMemoryResult,
  saveNumberMemoryResult,
  saveTypingResult,
  saveAimResult,
  getTestResults,
  getAllResults
} = require('../controllers/testResultsController');

// Visi maršruti ir aizsargāti
router.use(authenticateToken);

// Saglabāt rezultātus
router.post('/reaction', saveReactionResult);
router.post('/memory', saveMemoryResult);
router.post('/number-memory', saveNumberMemoryResult);
router.post('/typing', saveTypingResult);
router.post('/aim', saveAimResult);

// Iegūt rezultātus
router.get('/all', getAllResults);
router.get('/:testType', getTestResults);

module.exports = router;
