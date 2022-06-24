import { PluginConfig, defaultOptions } from '../';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createPluginConfig = (pluginOptions: any): PluginConfig => ({
  ...defaultOptions,
  ...pluginOptions,
  getOriginalPluginOptions: () => pluginOptions,
});
