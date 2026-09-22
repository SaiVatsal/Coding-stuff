export class RateLimiter {
  private tokens: number;
  private readonly queue: Array<() => void>;

  constructor(
    private readonly capacity: number,
    private readonly refillMs: number,
  ) {
    this.tokens = capacity;
    this.queue = [];

    setInterval(() => {
      this.tokens = this.capacity;
      this.releaseQueued();
    }, this.refillMs);
  }

  private releaseQueued() {
    while (this.tokens > 0 && this.queue.length > 0) {
      this.tokens -= 1;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }

  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }
}
