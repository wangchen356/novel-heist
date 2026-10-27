type Handler = (...args: unknown[]) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`[EventBus] ${event}`, error);
      }
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const bus = new EventBus();
