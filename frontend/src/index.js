// src/index.js (Final Corrected Code)

import React from 'react';
import ReactDOM from 'react-dom/client';
// CSS file import
import './index.css'; 
import App from './App';
// ✅ React Router ka BrowserRouter import karein
import { BrowserRouter as Router } from 'react-router-dom'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* ✅ Application ko Router se wrap karein taki useNavigate hook kaam kar sake */}
    <Router> 
      <App />
    </Router>
  </React.StrictMode>
);