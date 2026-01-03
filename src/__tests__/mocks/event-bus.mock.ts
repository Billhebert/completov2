/**
 * Mock for Event Bus
 */
export class MockEventBus {
  private listeners: Map<string, Function[]> = new Map();
  private emittedEvents: Array<{ event: string; data: any }> = [];

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  emit(event: string, data: any) {
    this.emittedEvents.push({ event, data });

    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  getEmittedEvents() {
    return this.emittedEvents;
  }

  clearEmittedEvents() {
    this.emittedEvents = [];
  }

  clear() {
    this.listeners.clear();
    this.emittedEvents = [];
  }

  hasEvent(event: string): boolean {
    return this.emittedEvents.some((e) => e.event === event);
  }

  getEventData(event: string): any[] {
    return this.emittedEvents
      .filter((e) => e.event === event)
      .map((e) => e.data);
  }
}

export const eventBusMock = new MockEventBus();
