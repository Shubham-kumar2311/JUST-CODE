// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route for "Ask AI" functionality
router.post('/ask-ai', aiController.askAI);

// Route for "Correct Syntax" functionality
router.post('/correct-syntax', aiController.correctSyntax);

module.exports = router;