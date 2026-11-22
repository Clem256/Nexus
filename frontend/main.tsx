import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './index.css';
import App from './App';
import { NexusProvider } from './store';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* HashRouter is required in Tauri since there is no HTTP server to handle client-side route fallbacks */}
        <HashRouter>
            <NexusProvider>
                <App />
            </NexusProvider>
        </HashRouter>
    </React.StrictMode>,
);
