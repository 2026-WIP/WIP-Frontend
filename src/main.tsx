import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import App from './App.tsx';
import { applyDensity, applyFont, applyTheme, useUIStore } from './store/useUIStore';

applyTheme(useUIStore.getState().theme);
applyFont(useUIStore.getState().font);
applyDensity(useUIStore.getState().density);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
