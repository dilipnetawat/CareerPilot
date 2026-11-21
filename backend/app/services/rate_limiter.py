import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException, Request, status


def get_client_ip(request: Request) -> str:
    """
    Safely resolves client IP address behind reverse proxies (such as Render / Cloudflare).
    Prefers verified proxy headers (CF-Connecting-IP, True-Client-IP) or parses X-Forwarded-For,
    falling back to direct client host.
    """
    # 1. Cloudflare connecting IP
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        return cf_ip.strip()

    # 2. True-Client-IP
    true_client_ip = request.headers.get("true-client-ip")
    if true_client_ip and true_client_ip.strip():
        return true_client_ip.strip()

    # 3. X-Forwarded-For: Client IP is the first entry added by the entry proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[0]

    # 4. Direct ASGI connection host
    if request.client and request.client.host:
        return request.client.host

    return "unknown"


class InMemoryRateLimiter:
    """
    Lightweight, thread-safe sliding-window in-memory rate limiter.
    Limits requests per key (e.g., client IP) within a moving time window.
    """

    def __init__(self, requests_limit: int = 10, window_seconds: int = 60):
        self.limit = requests_limit
        self.window = window_seconds
        self.records = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str) -> None:
        """
        Records an attempt for the given key. Raises HTTP 429 if the request limit is exceeded.
        """
        now = time.time()
        with self.lock:
            # Filter timestamps to keep only those within the active window
            recent = [t for t in self.records[key] if now - t < self.window]
            if len(recent) >= self.limit:
                retry_after = int(self.window - (now - recent[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many demo login requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )
            recent.append(now)
            self.records[key] = recent

    def reset(self) -> None:
        """Clears all recorded timestamps (useful for test isolation)."""
        with self.lock:
            self.records.clear()


# Default rate limiter: 10 requests per minute per IP
demo_login_rate_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
