const axios = require('axios');

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Call Gemini API with retry logic
 */
const callGeminiApi = async (payload, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        }
      );

      const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!result) {
        throw new Error("Gemini API response was empty or malformed.");
      }
      return result;

    } catch (error) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries - 1) {
        throw new Error(`Failed to communicate with Gemini API: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Generate comprehensive repository analysis using Gemini
 */
const analyzeWithAI = async (repoData, readme, contents, allFiles) => {
  const fileList = contents.map(f => f.name).join(', ');
  const fileTypes = allFiles.reduce((acc, f) => {
    const ext = f.name.split('.').pop();
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});

  const userQuery = `Analyze this GitHub repository and provide a comprehensive summary:

Repository: ${repoData.name}
Owner: ${repoData.owner.login}
Description: ${repoData.description || 'No description'}
Language: ${repoData.language || 'Multiple'}
Stars: ${repoData.stargazers_count}
Forks: ${repoData.forks_count}
Root Files: ${fileList}
Total Files: ${allFiles.length}
File Types: ${JSON.stringify(fileTypes, null, 2)}
README Excerpt: ${readme ? readme.substring(0, 1000) : 'No README'}

Provide a detailed technical analysis.`;

  const systemPrompt = `You are a world-class software architect and repository analyzer. Analyze the provided repository and create a comprehensive technical summary.

Use this exact Markdown format:

## Summary
Brief overview of the project (2-3 sentences).

## Tech Stack
List all detected technologies, frameworks, and languages (bullet points).

## Workflow
Explain the typical development workflow and how the project works (2-3 sentences).

## Key Features
Main features and functionalities (bullet points).

## Architecture
Describe the project structure and architecture pattern (e.g., Monolithic, Microservices, MVC, etc.).`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024
    }
  };

  return await callGeminiApi(payload);
};

/**
 * Generate Mermaid Data Flow Diagram using Gemini
 */
const generateDFD = async (repoData, allFiles, readme) => {
  const filePaths = allFiles.slice(0, 100).map(f => f.path).join('\n');
  
  const userQuery = `Based on this repository structure, generate a Mermaid flowchart diagram showing the high-level architecture and data flow:

Repository: ${repoData.name}
Language: ${repoData.language || 'Multiple'}
Description: ${repoData.description || 'No description'}

File Structure (sample):
${filePaths}

README Excerpt: ${readme ? readme.substring(0, 500) : 'No README'}

Generate ONLY the Mermaid code using 'graph TD' or 'flowchart TD' syntax. Do not include markdown code fences or any explanatory text.`;

  const systemPrompt = `You are an expert system architect. Generate a Mermaid diagram (flowchart TD format) representing the software architecture. 

Rules:
1. Use only 'graph TD' or 'flowchart TD' syntax
2. Include 5-10 main components
3. Show data/control flow with arrows
4. Use descriptive node labels
5. Output ONLY the Mermaid code, no markdown fences, no explanations`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512
    }
  };

  return await callGeminiApi(payload);
};

module.exports = {
  analyzeWithAI,
  generateDFD
};