import { createCandle, createTrade, createOrderBook } from '../../entities';

export interface WebSocketMessage {
  type: 'candle' | 'trade' | 'orderbook' | 'ping' | 'pong' | 'error';
  symbol?: string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  batchInterval: number;
}

export class WebSocketClient extends EventTarget {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer?: number;
  private pingTimer?: number;
  private batchTimer?: number;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions = new Set<string>();
  
  public connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    this.config = {
      url: 'wss://echo.websocket.org', // Mock WebSocket for demo
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      batchInterval: 100, // 100ms batching for performance
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionState = 'connecting';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionError();
    }
  }

  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));
  }

  subscribe(symbol: string): void {
    this.subscriptions.add(symbol);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        symbol,
      });
    }
  }

  unsubscribe(symbol: string): void {
    this.subscriptions.delete(symbol);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        type: 'unsubscribe',
        symbol,
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      // Resubscribe to all symbols
      this.subscriptions.forEach(symbol => {
        this.send({ type: 'subscribe', symbol });
      });

      // Start ping/pong heartbeat
      this.startPing();

      this.dispatchEvent(new CustomEvent('connectionStateChange', { 
        detail: { state: this.connectionState } 
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.cleanup();
      
      if (event.code !== 1000) { // Not a normal closure
        this.handleConnectionError();
      } else {
        this.connectionState = 'disconnected';
        this.dispatchEvent(new CustomEvent('connectionStateChange', { 
          detail: { state: this.connectionState } 
        }));
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // For demo purposes, generate mock data instead of using real WebSocket data
    if (message.type === 'ping') {
      this.send({ type: 'pong' });
      return;
    }

    // Add to batch queue for performance
    this.messageQueue.push(message);
    
    if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.processBatch();
        this.batchTimer = undefined;
      }, this.config.batchInterval);
    }
  }

  private processBatch(): void {
    if (this.messageQueue.length === 0) return;

    const batch = [...this.messageQueue];
    this.messageQueue = [];

    // Group messages by type and symbol
    const grouped: Record<string, WebSocketMessage[]> = {};
    
    batch.forEach(message => {
      const key = `${message.type}-${message.symbol || 'global'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(message);
    });

    // Process each group
    Object.values(grouped).forEach(messages => {
      messages.forEach(message => this.processMessage(message));
    });
  }

  private processMessage(message: WebSocketMessage): void {
    try {
      switch (message.type) {
        case 'candle':
          if (message.data && message.symbol) {
            const candle = createCandle(message.data);
            this.dispatchEvent(new CustomEvent('candle', {
              detail: { symbol: message.symbol, candle }
            }));
          }
          break;

        case 'trade':
          if (message.data && message.symbol) {
            const trade = createTrade(message.data);
            this.dispatchEvent(new CustomEvent('trade', {
              detail: { symbol: message.symbol, trade }
            }));
          }
          break;

        case 'orderbook':
          if (message.data && message.symbol) {
            const orderBook = createOrderBook(message.data);
            this.dispatchEvent(new CustomEvent('orderbook', {
              detail: { symbol: message.symbol, orderBook }
            }));
          }
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startPing(): void {
    this.pingTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config.pingInterval);
  }

  private handleConnectionError(): void {
    this.connectionState = 'error';
    this.cleanup();

    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));

    // Attempt reconnection
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      const delay = Math.min(
        this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        30000
      );

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Process any remaining messages
    this.processBatch();
  }
}