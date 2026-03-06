import type { ConfigType } from "./types.ts";

export const defaultConfig: Required<ConfigType> = {
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