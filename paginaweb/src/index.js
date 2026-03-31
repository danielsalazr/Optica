import React from 'react';
import ReactDom from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './routes/App';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './styles/style.scss';
import './styles/side_bar_menu.css';

ReactDom.createRoot(document.getElementById('app')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
