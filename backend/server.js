require('dotenv').config();
const express = require('express');
const cors = require('cors');
const githubRoutes = require('./routes/github');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use('/api/github', githubRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend running', apiKey: process.env.GEMINI_API_KEY ? '✓' : '✗' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✓ Loaded' : '✗ Missing'}`);
});