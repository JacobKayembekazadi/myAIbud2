/**
 * LLM Provider Types and Interfaces
 */

export type LLMProvider = "openai" | "gemini" | "anthropic";

export interface LLMModel {
  provider: LLMProvider;
  model: string;
}

export interface LLMConfig {
  primary: LLMModel;
  fallback?: LLMModel;
  tertiary?: LLMModel;
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LLMResponse {
  text: string;
  provider: LLMProvider;
  model: string;
  latencyMs: number;
  usedFallback: boolean;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Provider configuration with model options
 */
export interface ProviderConfig {
  provider: LLMProvider;
  displayName: string;
  models: {
    id: string;
    name: string;
    description: string;
    speed: "fast" | "medium" | "slow";
    quality: "standard" | "high" | "premium";
    costPer1kTokens: number;
    maxTokens: number;
    supportsVision: boolean;
  }[];
}

/**
 * Available providers with their models
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    provider: "openai",
    displayName: "OpenAI",
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and cost-effective for most tasks",
        speed: "fast",
        quality: "high",
        costPer1kTokens: 0.00015,
        maxTokens: 16384,
        supportsVision: true,
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Most capable model for complex reasoning",
        speed: "medium",
        quality: "premium",
        costPer1kTokens: 0.005,
        maxTokens: 16384,
        supportsVision: true,
      },
    ],
  },
  {
    provider: "gemini",
    displayName: "Google Gemini",
    models: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Fast multimodal model with good performance",
        speed: "medium",
        quality: "high",
        costPer1kTokens: 0.0001,
        maxTokens: 8192,
        supportsVision: true,
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Advanced model with 1M token context",
        speed: "slow",
        quality: "premium",
        costPer1kTokens: 0.00125,
        maxTokens: 8192,
        supportsVision: true,
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Balanced speed and capability",
        speed: "fast",
        quality: "standard",
        costPer1kTokens: 0.0001,
        maxTokens: 8192,
        supportsVision: true,
      },
    ],
  },
  {
    provider: "anthropic",
    displayName: "Anthropic Claude",
    models: [
      {
        id: "claude-3-5-haiku-latest",
        name: "Claude 3.5 Haiku",
        description: "Fastest Claude model, great for chat",
        speed: "fast",
        quality: "high",
        costPer1kTokens: 0.0008,
        maxTokens: 8192,
        supportsVision: false,
      },
      {
        id: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        description: "Best balance of speed and intelligence",
        speed: "medium",
        quality: "premium",
        costPer1kTokens: 0.003,
        maxTokens: 8192,
        supportsVision: true,
      },
    ],
  },
];

/**
 * Get provider config by ID
 */
export function getProviderConfig(provider: LLMProvider): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.provider === provider);
}

/**
 * Get model config
 */
export function getModelConfig(provider: LLMProvider, modelId: string) {
  const providerConfig = getProviderConfig(provider);
  return providerConfig?.models.find((m) => m.id === modelId);
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  provider: LLMProvider,
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelConfig = getModelConfig(provider, modelId);
  if (!modelConfig) return 0;

  const totalTokens = promptTokens + completionTokens;
  return (totalTokens / 1000) * modelConfig.costPer1kTokens;
}
