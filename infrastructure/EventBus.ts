import { EventEmitter } from 'events';

export interface AppEvent<T = any> {
  eventId: string;     // Unique UUID or transaction-related trace ID
  eventType: string;   // Event name (e.g., 'POS_SALE_COMPLETED')
  timestamp: string;   // ISO String
  companyId: string;   // Multitenant isolation
  payload: T;
}

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    // Configure maximum listeners to avoid warning logs in highly concurrent multi-tenant execution
    this.emitter.setMaxListeners(150);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Publish an event asynchronously via Local Event Loop.
   */
  public publish<T>(event: AppEvent<T>): void {
    console.log(`[EventBus] Publishing event "${event.eventType}" for company: "${event.companyId}"`);
    this.emitter.emit(event.eventType, event);
  }

  /**
   * Subscribe to a specific system event.
   */
  public subscribe<T>(eventType: string, listener: (event: AppEvent<T>) => void | Promise<void>): void {
    this.emitter.on(eventType, async (event: AppEvent<T>) => {
      try {
        await listener(event);
      } catch (error) {
        console.error(`[EventBus] Error occurred in subscription handler for "${eventType}":`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event.
   */
  public unsubscribe<T>(eventType: string, listener: (event: AppEvent<T>) => void): void {
    this.emitter.off(eventType, listener);
  }
}
