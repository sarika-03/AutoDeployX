import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Star, GitFork, Code, FileText, AlertCircle, ArrowLeft } from 'lucide-react'; // Adding icons for better UI

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [analysis, setAnalysis] = useState('');

  // API_URL ko environment variable se ya default value se lena.
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRepoData(null); // Clear previous results
    setAnalysis(''); // Clear previous analysis

    try {
      if (!repoUrl.trim()) {
        throw new Error('Please enter a repository URL');
      }

      // ⚠️ Note: Front-end code ko backend call karna chahiye, jaisa ki yahaan ho raha hai.

      const response = await fetch(`${API_URL}/api/github/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });

      if (!response.ok) {
        // Attempt to parse the error message from the backend response
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Analysis failed due to a server error.';
        
        if (contentType && contentType.includes('application/json')) {
            const err = await response.json();
            errorMessage = err.error || err.message || errorMessage;
        } else {
            // Handle plain text error responses
            const text = await response.text();
            errorMessage = text || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Basic validation for result structure
      if (!result.repoData || !result.analysis) {
        throw new Error('Received incomplete data from the analysis server.');
      }
      
      setRepoData(result.repoData);
      setAnalysis(result.analysis);
    } catch (err) {
      // Set the specific error message
      setError(err.message);
      console.error('Analysis Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page p-6 max-w-4xl mx-auto font-sans">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">
        <Search className="inline mr-2 text-blue-500" size={28} />
        Repository Analyzer
      </h1>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="flex gap-3 mb-8 bg-white p-4 rounded-xl shadow-lg border">
        <input
          type="text"
          placeholder="Enter GitHub repo URL (e.g., https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Analyzing...
            </>
          ) : (
            <>
              <Search size={20} />
              Analyze
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span className="font-medium">Error: {error}</span>
        </div>
      )}

      {/* Repository Data Display */}
      {repoData && (
        <div className="results bg-white p-6 rounded-xl shadow-xl border border-blue-100 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">{repoData.name}</h2>
          <p className="text-gray-600 mb-4">{repoData.description || 'No description provided.'}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <StatCard icon={<Star size={20} />} label="Stars" value={repoData.stars?.toLocaleString() || 'N/A'} />
            <StatCard icon={<GitFork size={20} />} label="Forks" value={repoData.forks?.toLocaleString() || 'N/A'} />
            <StatCard icon={<Code size={20} />} label="Language" value={repoData.language || 'Multiple'} />
            <StatCard icon={<FileText size={20} />} label="Size (KB)" value={(repoData.size / 1024)?.toFixed(2) || 'N/A'} />
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="analysis bg-gray-50 p-6 rounded-xl shadow-xl border border-green-100">
          <h3 className="text-xl font-bold text-green-700 mb-4 border-b pb-2">
            <FileText className="inline mr-2" size={20} />
            AI Analysis
          </h3>
          {/* Assuming analysis is simple text, use pre-wrap for better readability if Markdown is returned */}
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for statistics
const StatCard = ({ icon, label, value }) => (
    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center text-blue-500 mb-1">{icon}</div>
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
);