import { defaultConfig } from './defaults'
import type { ConfigType } from "./types.ts";

export const mergeConfig = (
  userConfig?: ConfigType,
): Required<ConfigType> => ({
  queryClient: {
    ...defaultConfig.queryClient,
    ...userConfig?.queryClient,
  },
})