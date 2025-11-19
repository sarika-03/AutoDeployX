const axios = require('axios');
const { analyzeWithAI, generateDFD } = require('../utils/aiAnalyzer');

// GitHub API configuration
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Optional but recommended

// Extract owner and repo from GitHub URL
const parseGitHubUrl = (url) => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '') // Remove .git if present
  };
};

// Fetch repository data from GitHub API
const fetchRepoData = async (owner, repo) => {
  const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
  
  const response = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
  return response.data;
};

// Fetch README content
const fetchReadme = async (owner, repo) => {
  try {
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    const response = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers });
    
    // Decode base64 content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return content;
  } catch (error) {
    console.log('No README found');
    return '';
  }
};

// Fetch repository contents (root level)
const fetchContents = async (owner, repo) => {
  try {
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    const response = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contents`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching contents:', error.message);
    return [];
  }
};

// Recursively fetch all files in repository
const fetchAllFiles = async (owner, repo, path = '', headers = {}) => {
  try {
    const response = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      { headers }
    );
    
    let allFiles = [];
    
    for (const item of response.data) {
      if (item.type === 'file') {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        // Recursively fetch files from subdirectories
        const subFiles = await fetchAllFiles(owner, repo, item.path, headers);
        allFiles = allFiles.concat(subFiles);
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error(`Error fetching files from ${path}:`, error.message);
    return [];
  }
};

// Main controller function
const analyzeRepository = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    console.log(`Analyzing repository: ${repoUrl}`);

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl);
    
    // Fetch repository data
    const repoData = await fetchRepoData(owner, repo);
    
    // Fetch README
    const readme = await fetchReadme(owner, repo);
    
    // Fetch root contents
    const contents = await fetchContents(owner, repo);
    
    // Fetch all files (limited depth to avoid rate limits)
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    let allFiles = await fetchAllFiles(owner, repo, '', headers);
    
    // Limit files to avoid overwhelming the AI
    if (allFiles.length > 200) {
      allFiles = allFiles.slice(0, 200);
    }

    console.log(`Fetched ${allFiles.length} files from repository`);

    // Generate AI analysis using Gemini
    console.log('Generating AI analysis with Gemini...');
    const analysis = await analyzeWithAI(repoData, readme, contents, allFiles);
    
    // Generate Data Flow Diagram using Gemini
    console.log('Generating DFD with Gemini...');
    const diagram = await generateDFD(repoData, allFiles, readme);

    // Send response
    res.json({
      success: true,
      repoData: {
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        open_issues_count: repoData.open_issues_count,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        owner: {
          login: repoData.owner.login,
          avatar_url: repoData.owner.avatar_url
        },
        html_url: repoData.html_url,
        license: repoData.license,
        topics: repoData.topics
      },
      analysis,
      diagram,
      allFiles: allFiles.map(f => ({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size,
        html_url: f.html_url
      }))
    });

  } catch (error) {
    console.error('Error analyzing repository:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'GitHub API rate limit exceeded. Please add GITHUB_TOKEN to .env file.' 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze repository' 
    });
  }
};

module.exports = {
  analyzeRepository
};