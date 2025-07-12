import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('CCC: React app starting...');
console.log('CCC: Looking for root element:', document.getElementById('root'));

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('CCC: Root element found, mounting React app...');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('CCC: React app mounted successfully');
  } else {
    console.error('CCC: Root element not found!');
  }
} catch (error) {
  console.error('CCC: Error mounting React app:', error);
}
