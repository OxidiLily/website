import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Stylesheet font dipasang media="print" di index.html supaya tidak memblokir
// render; di sini dinyalakan untuk semua media. Font menyusul saat tiba —
// dan kalau tidak pernah tiba, situs tetap tampil dengan font sistem alih-alih
// menggantung menunggu fonts.googleapis.com.
document.querySelectorAll<HTMLLinkElement>('link[data-font-tunda]').forEach((l) => {
  l.media = 'all';
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
