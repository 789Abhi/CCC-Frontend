import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('CCC: React app starting...');

// Check for metabox root first
const metaboxRoot = document.getElementById('ccc-metabox-root');
const adminRoot = document.getElementById('root');

try {
  if (metaboxRoot) {
    console.log('CCC: Metabox root element found, mounting metabox app...');
    createRoot(metaboxRoot).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('CCC: Metabox app mounted successfully');
  } else if (adminRoot) {
    console.log('CCC: Admin root element found, mounting admin app...');
    createRoot(adminRoot).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('CCC: Admin app mounted successfully');
  } else {
    console.error('CCC: No root element found!');
  }
} catch (error) {
  console.error('CCC: Error mounting React app:', error);
}
