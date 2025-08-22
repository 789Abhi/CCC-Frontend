import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Check for metabox root first
const metaboxRoot = document.getElementById('ccc-metabox-root');
const adminRoot = document.getElementById('root');

try {
  if (metaboxRoot) {
    createRoot(metaboxRoot).render(
      <App />
    );
  } else if (adminRoot) {
    createRoot(adminRoot).render(
      <App />
    );
  } else {
    console.error('CCC: No root element found!');
  }
} catch (error) {
  console.error('CCC: Error mounting React app:', error);
}
