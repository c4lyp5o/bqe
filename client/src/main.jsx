import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { VoiceProvider } from './context/VoiceContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VoiceProvider>
      <App />
    </VoiceProvider>
  </StrictMode>
);
