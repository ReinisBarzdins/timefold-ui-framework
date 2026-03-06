import { mergeConfig } from './mergeConfig';
import { appConfig } from '../../appConfig';

export const resolvedConfig = mergeConfig(appConfig);