import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [analysis, setAnalysis] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!repoUrl) throw new Error('Please enter a repository URL');

      // ✅ Call your backend (NOT GitHub directly)
      const response = await fetch(`${API_URL}/api/github/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await response.json();
      setRepoData(result.repoData);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer">
      <button onClick={() => navigate('/')}>← Back</button>

      <h1>Repository Analyzer</h1>

      <form onSubmit={handleAnalyze}>
        <input
          type="text"
          placeholder="Enter GitHub repo URL (e.g., https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {repoData && (
        <div className="results">
          <h2>{repoData.name}</h2>
          <p>{repoData.description}</p>
          <p>⭐ Stars: {repoData.stars}</p>
          <p>🔀 Forks: {repoData.forks}</p>
          <p>💻 Language: {repoData.language}</p>
        </div>
      )}

      {analysis && (
        <div className="analysis">
          <h3>AI Analysis</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}