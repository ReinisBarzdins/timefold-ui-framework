import { QueryClient } from '@tanstack/react-query'
import type { ConfigType } from "./types.ts";

export const createQueryClient = (config: Required<ConfigType>) => new QueryClient(config.queryClient);
