// src/LandingPage.js (Updated with more GitHub/Code Creativity)

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import * as THREE from 'three';
import { GitBranch, Zap, Code } from 'lucide-react';

function LandingPage() { 
  const navigate = useNavigate();
  const canvasContainerRef = useRef(null);
  
  // Three.js setup ka logic
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

    // --- NEW / IMPROVED THREE.JS LOGIC START ---

    const linesGroup = new THREE.Group();
    const packetGroup = new THREE.Group(); // Data packets ke liye naya group
    const NUM_ELEMENTS = 100; // Total nodes aur lines
    const elements = []; // Track nodes and lines

    // 💡 Nodes (Commits/Code Blocks) aur Lines (Branches) banayein
    for(let i = 0; i < NUM_ELEMENTS; i++) {
      const startX = (Math.random() - 0.5) * 100;
      const startY = (Math.random() - 0.5) * 100;
      const startZ = (Math.random() - 0.5) * 100;
      
      const start = new THREE.Vector3(startX, startY, startZ);
      const end = new THREE.Vector3(
        startX + (Math.random() - 0.5) * 30,
        startY + (Math.random() - 0.5) * 30,
        startZ + (Math.random() - 0.5) * 30
      );
      
      const points = [start, end];

      // 1. Lines (Branches)
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(0.2, 0.8, 1.0), // Light blue-cyan
        transparent: true, 
        opacity: 0.1 + Math.random() * 0.4
      });
      const line = new THREE.Line(geometry, material);
      linesGroup.add(line);

      // 2. Nodes (Commits/Data Points - Small Cubes for Code Block feel)
      const dotGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Cube geometry
      const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50 }); // Green for "Commit"
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(start);
      linesGroup.add(dot);
      
      // 3. Data Flow Packets (Small traveling spheres)
      const packetGeometry = new THREE.SphereGeometry(0.2, 6, 6);
      const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow/Orange for "Data Flow"
      const packet = new THREE.Mesh(packetGeometry, packetMaterial);
      packetGroup.add(packet);

      elements.push({ line, dot, packet, start, end, progress: Math.random() });
    }

    scene.add(linesGroup);
    scene.add(packetGroup); // Naya group scene mein add karein

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Group ko halke se rotate karein (GitHub Network Graph jaisa)
      linesGroup.rotation.x += 0.0005;
      linesGroup.rotation.y += 0.001;
      packetGroup.rotation.copy(linesGroup.rotation); // Packets ko lines ke saath rotate karein

      // 💡 Data Flow Packets ki movement
      elements.forEach(element => {
        element.progress += 0.005; // Travel speed
        if (element.progress > 1) {
          element.progress = 0; // Reset
        }
        
        // Lerp (Linear Interpolation) se packet ko start se end point tak move karein
        element.packet.position.lerpVectors(element.start, element.end, element.progress);
      });
      
      renderer.render(scene, camera);
    };
    // --- NEW / IMPROVED THREE.JS LOGIC END ---

    // Resize event handle karein
    const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); 

  // Component rendering (Same as before)
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900 font-[Inter] flex items-center justify-center">
      {/* 3D Animated Background Canvas Container */}
      <div 
        ref={canvasContainerRef} 
        className="absolute inset-0 z-0 opacity-40"
      ></div>

      <div className="relative z-10 max-w-4xl mx-auto py-24 px-6 text-white text-center">
        <GitBranch className="mx-auto text-blue-400 mb-4 animate-pulse" size={60} />
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 leading-tight drop-shadow-lg">
          AI Repository Architect
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Kisi bhi public GitHub repository ka gehrai se analysis karein, tech stack, architecture aur data flow diagrams turant Gemini aur HuggingFace ki madad se paayein.
        </p>

        {/* Start Analyzing Button (Navigation) */}
        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-3 px-10 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-2xl shadow-purple-900/50"
        >
          <Zap size={24} className="animate-pulse" />
          Analysis Shuru Karein (Start Analysis)
          <Code size={24} />
        </button>

        <div className="mt-16 text-gray-500 text-sm">
          <p>Powered by Node.js, React, Three.js, GitHub API, aur AI Models.</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;