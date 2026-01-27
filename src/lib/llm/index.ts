/**
 * Provider-Agnostic LLM System
 *
 * Supports multiple LLM providers with automatic fallback:
 * - OpenAI (GPT-4o, GPT-4o-mini) - Fast, reliable
 * - Google Gemini (2.0 Flash, 1.5 Pro) - Good for vision
 * - Anthropic (Claude 3.5 Sonnet, Haiku) - Very fast
 *
 * Features:
 * - Circuit breaker pattern for reliability
 * - Automatic fallback on failure
 * - Timeout handling
 * - Cost tracking
 * - Provider health monitoring
 */

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// Lazy imports for optional providers
let openaiModule: typeof import("@ai-sdk/openai") | null = null;
let anthropicModule: typeof import("@ai-sdk/anthropic") | null = null;

async function getOpenAI() {
  if (!openaiModule) {
    try {
      openaiModule = await import("@ai-sdk/openai");
    } catch {
      return null;
    }
  }
  return openaiModule;
}

async function getAnthropic() {
  if (!anthropicModule) {
    try {
      anthropicModule = await import("@ai-sdk/anthropic");
    } catch {
      return null;
    }
  }
  return anthropicModule;
}

// Provider types
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

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitStates: Map<string, CircuitState> = new Map();

const CIRCUIT_THRESHOLD = 3; // Failures before opening circuit
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

function getCircuitKey(provider: LLMProvider, model: string): string {
  return `${provider}:${model}`;
}

function isCircuitOpen(provider: LLMProvider, model: string): boolean {
  const key = getCircuitKey(provider, model);
  const state = circuitStates.get(key);

  if (!state) return false;

  // Check if circuit should reset
  if (state.isOpen && Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
    state.isOpen = false;
    state.failures = 0;
    return false;
  }

  return state.isOpen;
}

function recordFailure(provider: LLMProvider, model: string): void {
  const key = getCircuitKey(provider, model);
  const state = circuitStates.get(key) || { failures: 0, lastFailure: 0, isOpen: false };

  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= CIRCUIT_THRESHOLD) {
    state.isOpen = true;
    console.warn(`[LLM] Circuit breaker opened for ${key}`);
  }

  circuitStates.set(key, state);
}

function recordSuccess(provider: LLMProvider, model: string): void {
  const key = getCircuitKey(provider, model);
  circuitStates.set(key, { failures: 0, lastFailure: 0, isOpen: false });
}

// Provider-specific model resolution
async function getProviderModel(provider: LLMProvider, modelName: string) {
  switch (provider) {
    case "gemini":
      return google(modelName);

    case "openai": {
      const openai = await getOpenAI();
      if (!openai) {
        throw new Error("OpenAI provider not available. Install @ai-sdk/openai");
      }
      return openai.openai(modelName);
    }

    case "anthropic": {
      const anthropic = await getAnthropic();
      if (!anthropic) {
        throw new Error("Anthropic provider not available. Install @ai-sdk/anthropic");
      }
      return anthropic.anthropic(modelName);
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Generate with timeout
async function generateWithTimeout(
  model: any,
  system: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  timeoutMs: number
): Promise<{ text: string; usage?: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await generateText({
      model,
      system,
      prompt,
      temperature,
      abortSignal: controller.signal,
      // Note: maxTokens not directly supported in generateText, handled by model config
    });

    return {
      text: result.text,
      usage: result.usage,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate text with automatic fallback
 */
export async function generateWithFallback(config: LLMConfig): Promise<LLMResponse> {
  const {
    primary,
    fallback,
    tertiary,
    system,
    prompt,
    temperature = 0.7,
    maxTokens = 1000,
    timeoutMs = 10000,
  } = config;

  const providers = [primary, fallback, tertiary].filter(Boolean) as LLMModel[];

  for (let i = 0; i < providers.length; i++) {
    const { provider, model } = providers[i];
    const isLastProvider = i === providers.length - 1;

    // Check circuit breaker
    if (isCircuitOpen(provider, model)) {
      console.warn(`[LLM] Skipping ${provider}:${model} - circuit open`);
      continue;
    }

    const startTime = Date.now();

    try {
      console.log(`[LLM] Attempting ${provider}:${model}`);

      const providerModel = await getProviderModel(provider, model);
      const result = await generateWithTimeout(
        providerModel,
        system,
        prompt,
        temperature,
        maxTokens,
        timeoutMs
      );

      const latencyMs = Date.now() - startTime;
      recordSuccess(provider, model);

      console.log(`[LLM] Success with ${provider}:${model} in ${latencyMs}ms`);

      return {
        text: result.text,
        provider,
        model,
        latencyMs,
        usedFallback: i > 0,
        tokenUsage: result.usage ? {
          prompt: result.usage.promptTokens,
          completion: result.usage.completionTokens,
          total: result.usage.totalTokens,
        } : undefined,
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;
      recordFailure(provider, model);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[LLM] Failed ${provider}:${model} after ${latencyMs}ms: ${errorMessage}`);

      // If this is the last provider, throw the error
      if (isLastProvider) {
        throw new Error(`All LLM providers failed. Last error: ${errorMessage}`);
      }

      // Otherwise, continue to next provider
      console.log(`[LLM] Falling back to next provider...`);
    }
  }

  throw new Error("No LLM providers available");
}

/**
 * Simple generate function for single provider (no fallback)
 */
export async function generate(
  provider: LLMProvider,
  model: string,
  system: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }
): Promise<LLMResponse> {
  return generateWithFallback({
    primary: { provider, model },
    system,
    prompt,
    ...options,
  });
}

/**
 * Pre-configured provider presets for common use cases
 */
export const LLMPresets = {
  // Fast responses (customer chat)
  fast: {
    primary: { provider: "openai" as const, model: "gpt-4o-mini" },
    fallback: { provider: "anthropic" as const, model: "claude-3-5-haiku-latest" },
    tertiary: { provider: "gemini" as const, model: "gemini-2.0-flash" },
  },

  // High quality (complex reasoning)
  quality: {
    primary: { provider: "openai" as const, model: "gpt-4o" },
    fallback: { provider: "anthropic" as const, model: "claude-3-5-sonnet-latest" },
    tertiary: { provider: "gemini" as const, model: "gemini-1.5-pro" },
  },

  // Vision tasks
  vision: {
    primary: { provider: "gemini" as const, model: "gemini-2.0-flash" },
    fallback: { provider: "openai" as const, model: "gpt-4o" },
  },

  // Budget-friendly
  budget: {
    primary: { provider: "gemini" as const, model: "gemini-2.0-flash" },
    fallback: { provider: "openai" as const, model: "gpt-4o-mini" },
  },

  // Speed-optimized (sub-second responses)
  speed: {
    primary: { provider: "anthropic" as const, model: "claude-3-5-haiku-latest" },
    fallback: { provider: "openai" as const, model: "gpt-4o-mini" },
  },
};

/**
 * Get circuit breaker status for monitoring
 */
export function getProviderHealth(): Record<string, { healthy: boolean; failures: number }> {
  const health: Record<string, { healthy: boolean; failures: number }> = {};

  circuitStates.forEach((state, key) => {
    health[key] = {
      healthy: !state.isOpen,
      failures: state.failures,
    };
  });

  return health;
}

/**
 * Reset circuit breaker for a provider (for manual recovery)
 */
export function resetCircuitBreaker(provider: LLMProvider, model: string): void {
  const key = getCircuitKey(provider, model);
  circuitStates.delete(key);
  console.log(`[LLM] Circuit breaker reset for ${key}`);
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitStates.clear();
  console.log("[LLM] All circuit breakers reset");
}
