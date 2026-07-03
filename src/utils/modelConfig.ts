import { ModelConfig } from '../types';

export function hasUsableModelConfig(config: ModelConfig): boolean {
  return Boolean(
    config.baseUrl.trim() &&
    config.apiKey.trim() &&
    config.model.trim()
  );
}

export function normalizeModelConfig(config: ModelConfig): ModelConfig {
  return {
    ...config,
    baseUrl: config.baseUrl.trim(),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
  };
}
