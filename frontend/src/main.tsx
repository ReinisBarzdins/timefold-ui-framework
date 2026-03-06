import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { mergeConfig } from './core/config/mergeConfig'
import { createQueryClient } from './core/config/CoreQueryClient'

import { appConfig } from './appConfig'

import './index.css'
import App from './App.tsx'
import { initAxiosClient } from "./core/config/axiosClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";

const config = mergeConfig(appConfig)

const queryClient = createQueryClient(config)
initAxiosClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </StrictMode>,
)
