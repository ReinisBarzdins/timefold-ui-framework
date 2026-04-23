import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

async function init() {
  try {
    const response = await fetch("/timestruct-config");
    window.APP_CONFIG = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // fallback to default if config endpoint fails
    window.APP_CONFIG = { apiPrefix: "/timestruct" };
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App/>
      </QueryClientProvider>
    </StrictMode>,
  )
}

init();


