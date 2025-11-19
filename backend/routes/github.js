const express = require('express');
const githubController = require('../controllers/githubController');

const router = express.Router();

router.post('/analyze', githubController.analyzeRepository);
router.post('/analyze-huggingface', githubController.analyzeWithHuggingFace);

module.exports = router;