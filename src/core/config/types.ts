import type { QueryClientConfig } from "@tanstack/react-query";

export type ConfigType = {
    api: {
        baseUrl: string,
    }
    queryClient: QueryClientConfig,
}