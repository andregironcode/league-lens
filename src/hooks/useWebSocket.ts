import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const {
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5
  } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const messageHandlers = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  const connect = useCallback(() => {
    try {
      console.log('[WebSocket] Connecting to', url);
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        reconnectCount.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] Received:', message.type);
          setLastMessage(message);
          
          // Call registered handlers
          const handlers = messageHandlers.current.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message));
          }
          
          // Call wildcard handlers
          const wildcardHandlers = messageHandlers.current.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
      
      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          console.log(`[WebSocket] Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`);
          setTimeout(connect, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }, [url, reconnect, reconnectInterval, reconnectAttempts]);
  
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);
  
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('[WebSocket] Not connected, cannot send message');
    return false;
  }, []);
  
  const subscribe = useCallback((matchId?: string, leagueId?: string, type?: string) => {
    return sendMessage({
      type: 'subscribe',
      data: { matchId, leagueId, type }
    });
  }, [sendMessage]);
  
  const unsubscribe = useCallback((matchId?: string, leagueId?: string, type?: string) => {
    return sendMessage({
      type: 'unsubscribe',
      data: { matchId, leagueId, type }
    });
  }, [sendMessage]);
  
  const on = useCallback((messageType: string, handler: (data: any) => void) => {
    if (!messageHandlers.current.has(messageType)) {
      messageHandlers.current.set(messageType, new Set());
    }
    messageHandlers.current.get(messageType)!.add(handler);
    
    // Return cleanup function
    return () => {
      const handlers = messageHandlers.current.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.current.delete(messageType);
        }
      }
    };
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000);
    
    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    on,
    reconnect: connect,
    disconnect
  };
}

// WebSocket URL helper
export function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:3001';
  return `${protocol}//${host}`;
}