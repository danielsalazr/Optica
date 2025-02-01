import React from 'react';
// import ReactDom from 'react-dom';
import ReactDom from 'react-dom/client';
import App from './routes/App';
import './styles/style.scss';
// import './styles/bootstrap.min.css';
import './styles/side_bar_menu.css';

ReactDom.createRoot (document.getElementById('app')).render(<App />, );