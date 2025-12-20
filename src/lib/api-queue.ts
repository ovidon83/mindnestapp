// Smart API request queue with rate limiting and cost optimization

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  priority: 'high' | 'normal' | 'low';
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class APIQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastApiCallTime = 0;
  private minDelayBetweenCalls = 8000; // 8 seconds minimum between calls to respect TPM limits (gpt-4o has 30k TPM, ~500 tokens per request = ~60 requests/min max)
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;
  private backoffMultiplier = 2;
  private currentBackoff = 0;
  private quotaExceeded = false; // Global flag to stop all generation when quota is hit

  // Add request to queue
  async enqueue<T>(
    id: string,
    fn: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id,
        fn,
        priority,
        resolve,
        reject,
      };

      // Insert based on priority
      if (priority === 'high') {
        this.queue.unshift(request);
      } else if (priority === 'low') {
        this.queue.push(request);
      } else {
        // Insert normal priority after high, before low
        const firstLowIndex = this.queue.findIndex(r => r.priority === 'low');
        if (firstLowIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(firstLowIndex, 0, request);
        }
      }

      // Start processing if not already
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  // Process queue with smart delays
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Check if we've hit too many failures - back off
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        const backoffDelay = this.currentBackoff || 10000; // Start with 10s
        console.warn(`Too many API failures. Backing off for ${backoffDelay}ms`);
        await this.delay(backoffDelay);
        this.currentBackoff = backoffDelay * this.backoffMultiplier;
        this.consecutiveFailures = 0; // Reset after backoff
      }

      const request = this.queue.shift();
      if (!request) break;

      try {
        // Enforce minimum delay between calls
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCallTime;
        if (timeSinceLastCall < this.minDelayBetweenCalls) {
          await this.delay(this.minDelayBetweenCalls - timeSinceLastCall);
        }

        // Execute request
        const result = await request.fn();
        this.lastApiCallTime = Date.now();
        
        // Reset failure tracking on success
        this.consecutiveFailures = 0;
        this.currentBackoff = 0;
        
        request.resolve(result);
        
        // Add delay after successful call to avoid rate limits
        await this.delay(this.minDelayBetweenCalls);
      } catch (error: any) {
        this.lastApiCallTime = Date.now();
        
        // Check if quota is exceeded - don't retry, fail immediately
        // Only stop if it's actually a quota error, not a rate limit
        const isQuotaError = error?.isQuotaExceeded || 
                            (error?.data?.error?.code === 'insufficient_quota' && error?.status !== 429);
        
        if (isQuotaError) {
          console.error('OpenAI API quota exceeded. Stopping queue processing.', error);
          // Reject this request and clear queue
          request.reject(error);
          // Clear remaining queue to prevent wasting more attempts
          while (this.queue.length > 0) {
            const failedItem = this.queue.shift();
            if (failedItem) {
              failedItem.reject(new Error('API quota exceeded. Please check your OpenAI API key billing and usage limits.'));
            }
          }
          this.processing = false;
          return;
        }
        
        // Check if it's a rate limit error
        if (error?.status === 429 || error?.statusCode === 429) {
          this.consecutiveFailures++;
          
          // For rate limits, wait longer before retrying
          const rateLimitDelay = Math.min(5000 * Math.pow(2, this.consecutiveFailures - 1), 30000);
          console.warn(`Rate limited. Waiting ${rateLimitDelay}ms before next request`);
          await this.delay(rateLimitDelay);
          
          // Re-queue the request with lower priority
          if (this.consecutiveFailures < this.maxConsecutiveFailures) {
            this.queue.push({ ...request, priority: 'low' });
          } else {
            request.reject(error);
          }
        } else {
          // For other errors, don't retry
          request.reject(error);
        }
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear queue (useful for cleanup)
  clear() {
    this.queue.forEach(req => req.reject(new Error('Queue cleared')));
    this.queue = [];
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      consecutiveFailures: this.consecutiveFailures,
    };
  }
}

// Singleton instance
export const apiQueue = new APIQueue();

