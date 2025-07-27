import { WebSocketServer } from 'ws';
import { getFromCache } from './cache.js';

class MatchWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map(); // Track client subscriptions
    this.liveMatches = new Set(); // Track active live matches
    
    this.setupWebSocketServer();
    this.startLiveMatchPolling();
  }
  
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`[WebSocket] Client connected: ${clientId}`);
      
      // Initialize client tracking
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        lastPing: Date.now()
      });
      
      // Handle messages from client
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('[WebSocket] Invalid message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
      
      // Send initial connection success
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: 'Connected to League Lens real-time updates'
      }));
      
      // Setup ping/pong for connection health
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });
  }
  
  handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message.data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.data);
        break;
      case 'ping':
        client.ws.send(JSON.stringify({ type: 'pong' }));
        client.lastPing = Date.now();
        break;
      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }
  
  handleSubscribe(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { matchId, leagueId, type = 'all' } = data;
    
    if (matchId) {
      const subscription = `match:${matchId}`;
      client.subscriptions.add(subscription);
      console.log(`[WebSocket] Client ${clientId} subscribed to ${subscription}`);
      
      // Send current match data immediately
      this.sendMatchUpdate(clientId, matchId);
    }
    
    if (leagueId) {
      const subscription = `league:${leagueId}`;
      client.subscriptions.add(subscription);
      console.log(`[WebSocket] Client ${clientId} subscribed to ${subscription}`);
    }
    
    if (type === 'all' || type === 'live') {
      client.subscriptions.add('live:matches');
      console.log(`[WebSocket] Client ${clientId} subscribed to live matches`);
    }
  }
  
  handleUnsubscribe(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { matchId, leagueId, type } = data;
    
    if (matchId) {
      client.subscriptions.delete(`match:${matchId}`);
    }
    if (leagueId) {
      client.subscriptions.delete(`league:${leagueId}`);
    }
    if (type === 'all' || type === 'live') {
      client.subscriptions.delete('live:matches');
    }
  }
  
  async sendMatchUpdate(clientId, matchId) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== client.ws.OPEN) return;
    
    try {
      // Try to get match data from cache first
      const cacheKey = `/api/highlightly/matches/${matchId}`;
      const matchData = await getFromCache(cacheKey);
      
      if (matchData) {
        client.ws.send(JSON.stringify({
          type: 'match:update',
          matchId,
          data: matchData,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error(`[WebSocket] Error sending match update:`, error);
    }
  }
  
  broadcastToSubscribers(subscription, data) {
    let broadcastCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(subscription) && client.ws.readyState === client.ws.OPEN) {
        client.ws.send(JSON.stringify(data));
        broadcastCount++;
      }
    });
    
    if (broadcastCount > 0) {
      console.log(`[WebSocket] Broadcasted to ${broadcastCount} clients for ${subscription}`);
    }
  }
  
  async startLiveMatchPolling() {
    // Poll for live match updates every 10 seconds
    setInterval(async () => {
      try {
        // Get today's matches from cache
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `/api/highlightly/matches?date=${today}&live=true`;
        const liveMatches = await getFromCache(cacheKey);
        
        if (liveMatches && Array.isArray(liveMatches)) {
          // Track currently live matches
          const currentLiveIds = new Set(
            liveMatches
              .filter(m => this.isMatchLive(m))
              .map(m => m.id)
          );
          
          // Check for status changes
          currentLiveIds.forEach(matchId => {
            if (!this.liveMatches.has(matchId)) {
              // New live match
              console.log(`[WebSocket] Match ${matchId} is now LIVE`);
              this.broadcastToSubscribers('live:matches', {
                type: 'match:live',
                matchId,
                timestamp: new Date().toISOString()
              });
            }
          });
          
          // Check for matches that are no longer live
          this.liveMatches.forEach(matchId => {
            if (!currentLiveIds.has(matchId)) {
              console.log(`[WebSocket] Match ${matchId} is no longer live`);
              this.broadcastToSubscribers('live:matches', {
                type: 'match:ended',
                matchId,
                timestamp: new Date().toISOString()
              });
            }
          });
          
          // Update live matches set
          this.liveMatches = currentLiveIds;
          
          // Broadcast live match updates
          liveMatches.forEach(match => {
            if (this.isMatchLive(match)) {
              // Broadcast to match-specific subscribers
              this.broadcastToSubscribers(`match:${match.id}`, {
                type: 'match:update',
                matchId: match.id,
                data: match,
                timestamp: new Date().toISOString()
              });
              
              // Broadcast to league subscribers
              if (match.league_id) {
                this.broadcastToSubscribers(`league:${match.league_id}`, {
                  type: 'league:match:update',
                  leagueId: match.league_id,
                  matchId: match.id,
                  data: match,
                  timestamp: new Date().toISOString()
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('[WebSocket] Error in live match polling:', error);
      }
    }, 10000); // Poll every 10 seconds
  }
  
  isMatchLive(match) {
    const status = (match.status || '').toLowerCase();
    return status.includes('live') || 
           status.includes('1h') || 
           status.includes('2h') || 
           status.includes('half');
  }
  
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Graceful shutdown
  shutdown() {
    console.log('[WebSocket] Shutting down WebSocket server...');
    this.clients.forEach((client) => {
      client.ws.close(1000, 'Server shutting down');
    });
    this.wss.close();
  }
}

export default MatchWebSocketServer;