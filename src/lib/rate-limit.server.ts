type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return new Response("Too many requests. Please wait and try again.", {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
