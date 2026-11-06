import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { openWindow } from './lib/actions.js';

openWindow('login', 'login', { x: Math.max(0, innerWidth / 2 - 152), y: 40, w: 304 });
createRoot(document.getElementById('root')).render(<App />);
