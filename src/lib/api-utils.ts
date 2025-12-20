// Utility functions for API calls with rate limiting and retry logic

import { apiQueue } from './api-queue';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

// Retry with exponential backoff (simplified - queue handles most of this)
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 1, baseDelay = 1000, maxDelay = 10000 } = options; // Only 1 retry max
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isRateLimit = error?.status === 429 || error?.statusCode === 429;
      const isServerError = error?.status >= 500 || error?.statusCode >= 500;
      
      // Only retry on rate limits or server errors
      if (isLastAttempt || (!isRateLimit && !isServerError)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // For rate limits, wait longer
      if (isRateLimit) {
        const rateLimitDelay = delay * 3; // Wait 3x longer for rate limits
        console.warn(`Rate limited. Retrying in ${rateLimitDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      } else {
        console.warn(`API error. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Wrapper for fetch with queue, retry logic and better error handling
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  // Use queue for all API calls to prevent rate limiting
  const requestId = `${url}-${Date.now()}-${Math.random()}`;
  const priority = retryOptions?.maxRetries === 0 ? 'low' : 'normal';
  
  return apiQueue.enqueue(requestId, async () => {
    return retryWithBackoff(async () => {
      const response = await fetch(url, options);
      
      // Handle rate limiting (429) - this is usually NOT a quota error
      if (response.status === 429) {
        // Try to parse the error to see if it's actually quota-related
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Ignore JSON parse errors
        }
        
        const error: any = new Error('Rate limited by API');
        error.status = 429;
        error.response = response;
        error.data = errorData;
        
        // Only treat as quota if explicitly stated AND it's not a rate limit message
        const errorCode = errorData.error?.code;
        const errorMessage = errorData.error?.message || '';
        
        // Check for insufficient_quota in 429 responses
        if (errorCode === 'insufficient_quota') {
          const quotaError: any = new Error(errorMessage || 'OpenAI API quota exceeded');
          quotaError.isQuotaExceeded = true;
          quotaError.status = 429;
          quotaError.data = errorData;
          quotaError.error = errorData.error;
          throw quotaError;
        }
        // 429 with insufficient_quota usually means rate limit, not actual quota
        // Only mark as quota if message explicitly says quota (not rate)
        if (errorCode === 'insufficient_quota' && errorMessage.toLowerCase().includes('quota') && 
            !errorMessage.toLowerCase().includes('rate') && !errorMessage.toLowerCase().includes('limit')) {
          error.isQuotaExceeded = true;
          console.error('Quota error detected in 429 response:', errorData);
        }
        
        throw error;
      }
      
      // Handle bad requests (don't retry these)
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(`Bad request: ${errorData.error?.message || 'Invalid request'}`);
        error.status = 400;
        error.response = response;
        error.data = errorData;
        
        // Check for insufficient_quota - this is a permanent error
        // Only treat as quota error if explicitly stated (not rate limits)
        const errorCode = errorData.error?.code;
        const errorType = errorData.error?.type;
        const errorMessage = errorData.error?.message || '';
        
        if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota' ||
            (errorMessage.toLowerCase().includes('quota') && !errorMessage.toLowerCase().includes('rate'))) {
          error.isQuotaExceeded = true;
          console.error('OpenAI quota error detected:', errorData);
        }
        throw error;
      }
      
      // Handle other errors
      if (!response.ok) {
        // Try to parse error response for quota issues
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Ignore JSON parse errors
        }
        
        const error: any = new Error(`API error: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        error.data = errorData;
        
        // Check for insufficient_quota in error response
        // Only treat as quota error if explicitly stated (not rate limits)
        const errorCode = errorData.error?.code;
        const errorType = errorData.error?.type;
        const errorMessage = errorData.error?.message || '';
        
        // insufficient_quota means actual quota/billing issue, not rate limiting
        if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota' || 
            errorMessage.toLowerCase().includes('quota') && !errorMessage.toLowerCase().includes('rate')) {
          error.isQuotaExceeded = true;
          console.error('OpenAI quota error detected:', errorData);
        }
        
        throw error;
      }
      
      return response;
    }, retryOptions);
  }, priority);
}

// Validate DALL-E prompt before sending
export function validateDallePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt is empty' };
  }
  
  // DALL-E 3 has a 4000 character limit
  if (prompt.length > 4000) {
    return { valid: false, error: 'Prompt exceeds 4000 character limit' };
  }
  
  // Check for potentially problematic content
  const problematicPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];
  
  for (const pattern of problematicPatterns) {
    if (pattern.test(prompt)) {
      return { valid: false, error: 'Prompt contains potentially unsafe content' };
    }
  }
  
  return { valid: true };
}

