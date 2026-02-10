import type { ConfigType } from "./core/config/types.ts";

export const appConfig: Required<ConfigType> = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  },
  queryClient: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  }
};