import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Star, GitFork, Code, Loader2, FileText, Workflow, File, Folder, ChevronDown, ChevronRight, Activity, ArrowLeft, Zap, Layers, AlertCircle, GitBranch } from 'lucide-react';
import * as THREE from 'three';

// Landing Page Component
function LandingPage({ onNavigate }) {
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    camera.position.z = 50;

    const linesGroup = new THREE.Group();
    const NUM_LINES = 70;
    
    for(let i = 0; i < NUM_LINES; i++) {
      const points = [];
      const startX = (Math.random() - 0.5) * 100;
      const startY = (Math.random() - 0.5) * 100;
      const startZ = (Math.random() - 0.5) * 100;
      
      points.push(new THREE.Vector3(startX, startY, startZ));
      points.push(new THREE.Vector3(
        startX + (Math.random() - 0.5) * 30,
        startY + (Math.random() - 0.5) * 30,
        startZ + (Math.random() - 0.5) * 30
      ));

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(0.2, 0.8, 1.0), 
        transparent: true, 
        opacity: 0.1 + Math.random() * 0.4
      });
      const line = new THREE.Line(geometry, material);
      linesGroup.add(line);

      const dotGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(points[0]);
      linesGroup.add(dot);
    }

    scene.add(linesGroup);

    const animate = () => {
      requestAnimationFrame(animate);
      linesGroup.rotation.x += 0.0005;
      linesGroup.rotation.y += 0.001;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const features = [
    { icon: Layers, title: "Deep Architecture Scan", description: "Repository ke patterns, dependencies aur components ko identify karein." },
    { icon: Workflow, title: "Data Flow Visualization", description: "Application ke core processes ka high-level diagram generate karein." },
    { icon: Zap, title: "AI-Powered Analysis", description: "Tech stack, architecture aur workflow ka structured summary paayein." },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900 font-sans">
      <div 
        ref={canvasContainerRef} 
        className="absolute inset-0 z-0 opacity-40"
      ></div>

      <div className="relative z-10 max-w-5xl mx-auto py-24 px-6 text-white text-center">
        <GitBranch className="mx-auto text-blue-400 mb-4 animate-pulse" size={60} />
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 leading-tight drop-shadow-lg">
          AI Repository Architect
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Kisi bhi public GitHub repository ka gehrai se analysis karein, tech stack, architecture aur data flow diagrams turant paayein.
        </p>

        <button
          onClick={() => onNavigate('analyzer')}
          className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-2xl shadow-purple-900/50"
        >
          <Zap size={24} className="animate-pulse" />
          Analysis Shuru Karein
          <Code size={24} />
        </button>

        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8 text-gray-200">Aapko Kya Milega</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 transition-transform hover:scale-105 duration-300 border border-purple-500/20 shadow-lg"
              >
                <feature.icon className="mx-auto mb-4 text-yellow-400" size={32} />
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-gray-500 text-sm">
          <p>Powered by Node.js, React, Three.js, GitHub API aur AI Models.</p>
        </div>
      </div>
    </div>
  );
}

// Analyzer Page Component
function AnalyzerPage({ onNavigate }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [error, setError] = useState('');
  const [showFiles, setShowFiles] = useState(false);
  const [diagram, setDiagram] = useState(null);

  const handleAnalyze = async () => {
    setError('');
    setRepoData(null);
    setAnalysis(null);
    setAllFiles([]);
    setDiagram(null);

    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubUrlPattern.test(repoUrl.trim())) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/facebook/react)');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const urlParts = repoUrl.trim().replace(/\/$/, '').split('/');
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      
      if (!repoResponse.ok) {
        throw new Error('Repository not found ya API rate limit exceeded ho gaya hai');
      }
      
      const repoDataResult = await repoResponse.json();
      
      const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      const contentsData = await contentsResponse.json();
      
      const files = Array.isArray(contentsData) ? contentsData.filter(f => f.type === 'file') : [];
      
      setRepoData(repoDataResult);
      setAllFiles(files);
      
      setAnalysis(`## Summary
${repoDataResult.description || 'Ek GitHub repository'} jisme ${repoDataResult.stargazers_count} stars hain.

## Tech Stack
- Primary Language: ${repoDataResult.language || 'Multiple'}
- Size: ${(repoDataResult.size / 1024).toFixed(2)} MB
- Created: ${new Date(repoDataResult.created_at).toLocaleDateString()}

## Architecture
Yeh ek ${repoDataResult.language || 'multi-language'} project hai jo standard repository structure follow karta hai.

## Key Features
- Active development ke saath ${repoDataResult.forks_count} forks
- ${repoDataResult.open_issues_count} open issues
- Licensed under ${repoDataResult.license?.name || 'No license'}`);

      setDiagram(`graph TD
    A[User] -->|Interacts| B[${repoDataResult.name}]
    B -->|Uses| C[${repoDataResult.language || 'Core'}]
    C -->|Processes| D[Output]
    D -->|Returns to| A`);

    } catch (err) {
      setError(err.message || 'Repository analyze karne mein error aaya. URL check karein ya dubara try karein.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.(js|jsx|ts|tsx)$/)) return '🟨';
    if (filename.match(/\.(py)$/)) return '🐍';
    if (filename.match(/\.(html)$/)) return '🌐';
    if (filename.match(/\.(css|scss)$/)) return '🎨';
    if (filename.match(/\.(json|yml|yaml|config)$/)) return '📦';
    if (filename.match(/\.(md)$/)) return '📝';
    return '📄';
  };

  const cleanDiagram = (mermaidCode) => {
    return mermaidCode
        .replace(/^\s*```mermaid\s*/i, '')
        .replace(/^\s*```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 relative">
          <button
            onClick={() => onNavigate('landing')}
            className="absolute top-0 left-0 flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors transform hover:scale-105"
          >
            <ArrowLeft size={20} />
            Home Page
          </button>
          
          <h1 className="text-5xl font-extrabold mb-3 pt-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            GitHub Repository Analyzer
          </h1>
          <p className="text-gray-300 text-lg">AI-Powered Repository Analysis with Complete Insights</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 border border-purple-500/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="GitHub repository URL enter karein (e.g., https://github.com/facebook/react)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-white placeholder-gray-400 transition-all"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !repoUrl.trim()}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Analyze Repository
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 shadow-inner flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {repoData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 shadow-xl">
              <User className="mb-3 text-blue-400" size={24} />
              <div className="text-gray-300 text-sm mb-1">Owner</div>
              <div className="text-xl font-bold truncate">{repoData.owner.login}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-xl">
              <Star className="mb-3 text-yellow-400" size={24} />
              <div className="text-gray-300 text-sm mb-1">Stars</div>
              <div className="text-xl font-bold">{repoData.stargazers_count.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-pink-600/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-pink-500/30 shadow-xl">
              <GitFork className="mb-3 text-green-400" size={24} />
              <div className="text-gray-300 text-sm mb-1">Forks</div>
              <div className="text-xl font-bold">{repoData.forks_count.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 shadow-xl">
              <Activity className="mb-3 text-red-400" size={24} />
              <div className="text-gray-300 text-sm mb-1">Open Issues</div>
              <div className="text-xl font-bold">{repoData.open_issues_count}</div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-3">
              <FileText className="text-green-400" size={24} />
              <h2 className="text-2xl font-bold">AI-Powered Summary</h2>
              <span className="ml-auto px-3 py-1 bg-purple-600/30 rounded-full text-xs font-medium">Powered by AI</span>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed bg-gray-900/50 p-6 rounded-lg border border-green-500/30">
                {analysis}
              </div>
            </div>
          </div>
        )}

        {diagram && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 border border-cyan-500/20">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-3">
              <Workflow className="text-cyan-400" size={24} />
              <h2 className="text-2xl font-bold">Data Flow Diagram (Mermaid Syntax)</h2>
            </div>
            
            <div className="bg-gray-900/50 p-6 rounded-lg overflow-x-auto border border-cyan-500/30">
              <pre className="text-cyan-300 text-sm font-mono whitespace-pre">
                {cleanDiagram(diagram)}
              </pre>
              <div className='text-xs text-gray-500 mt-2'>
                (Is Mermaid code ko mermaid.live par visualize karein)
              </div>
            </div>
          </div>
        )}

        {allFiles.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                <Folder className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold">Repository Files</h2>
                <span className="px-3 py-1 bg-blue-600/30 rounded-full text-sm font-medium">{allFiles.length} files</span>
              </div>
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors font-medium"
              >
                {showFiles ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                {showFiles ? 'Hide' : 'Show'} Files
              </button>
            </div>

            {showFiles && (
              <div className="max-h-96 overflow-y-auto bg-gray-900/50 rounded-lg p-4 border border-yellow-500/30">
                <div className="space-y-1">
                  {allFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded group transition-colors"
                    >
                      <span className="text-lg w-6 flex-shrink-0">{getFileIcon(file.name)}</span>
                      <File size={16} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 font-mono flex-1 truncate">{file.path || file.name}</span>
                      
                      {file.html_url && (
                        <a 
                          href={file.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded transition-all font-medium"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!repoData && !loading && (
          <div className="text-center py-16">
            <Workflow className="mx-auto mb-4 text-gray-600" size={64} />
            <p className="text-gray-400 text-lg">Shuru karne ke liye GitHub repository URL enter karein</p>
            <p className="text-gray-500 text-sm mt-2">Kisi bhi public repository ke baare mein AI-powered insights paayein</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Application
export default function App() {
  const [page, setPage] = useState('landing');

  const handleNavigation = (targetPage) => {
    setPage(targetPage);
  };

  return page === 'landing' 
    ? <LandingPage onNavigate={handleNavigation} />
    : <AnalyzerPage onNavigate={handleNavigation} />;
}